import json
import logging
import time
import uuid
from collections import defaultdict

import requests
from flask import Flask, request, jsonify
from usecases.chat import GenerateChatResponse
from usecases.mcp_manager import MCPManager
from settings import TURNSTILE_SECRET_KEY

logger = logging.getLogger(__name__)


# Autenticação — tokens de sessão emitidos após verificação do Captcha

_valid_session_tokens: dict[str, dict] = {}
SESSION_TOKEN_TTL = 3600  # segundos
# SIDs autenticados nesta instância do servidor
_authenticated_sids: set[str] = set()

RATE_LIMIT_MAX = 20  # máximo de mensagens
RATE_LIMIT_WINDOW = 60  # janela em segundos
_message_timestamps: dict[str, list[float]] = defaultdict(list)


def _purge_expired_tokens() -> None:
    """Remove tokens expirados do armazenamento em memória."""
    now = time.time()
    expired = [
        t
        for t, meta in _valid_session_tokens.items()
        if now - meta["created_at"] > SESSION_TOKEN_TTL
    ]
    for t in expired:
        del _valid_session_tokens[t]


def _verify_turnstile(token: str, ip: str) -> bool:
    """Verifica o token Turnstile junto à API da Cloudflare."""
    if not TURNSTILE_SECRET_KEY:
        logger.warning(
            "TURNSTILE_SECRET_KEY não configurada — verificação desabilitada"
        )
        return True
    try:
        resp = requests.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={"secret": TURNSTILE_SECRET_KEY, "response": token, "remoteip": ip},
            timeout=5,
        )
        return resp.json().get("success", False)
    except Exception:
        logger.exception("Falha ao verificar token Turnstile")
        return False


def _is_rate_limited(sid: str) -> bool:
    """Retorna True se o SID excedeu o limite de mensagens na janela."""
    now = time.time()
    timestamps = _message_timestamps[sid]
    # Descarta entradas fora da janela
    _message_timestamps[sid] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(_message_timestamps[sid]) >= RATE_LIMIT_MAX:
        return True
    _message_timestamps[sid].append(now)
    return False


def initialize_chat_routes(app: Flask) -> None:
    """Registra rotas HTTP de autenticação: verificação do Captcha e validação de sessão."""

    @app.route("/validate-session", methods=["POST"])
    def validate_session():
        body = request.get_json(silent=True) or {}
        token = body.get("token", "")
        if not token:
            return jsonify({"valid": False}), 200
        _purge_expired_tokens()
        is_valid = token in _valid_session_tokens
        return jsonify({"valid": is_valid}), 200

    @app.route("/verify-captcha", methods=["POST"])
    def verify_captcha():
        body = request.get_json(silent=True) or {}
        cf_token = body.get("token", "")
        client_ip = request.headers.get("CF-Connecting-IP") or request.remote_addr

        if not cf_token:
            return jsonify({"error": "Token ausente"}), 400

        if not _verify_turnstile(cf_token, client_ip):
            return jsonify({"error": "Verificação de captcha falhou"}), 403

        _purge_expired_tokens()
        session_token = str(uuid.uuid4())
        _valid_session_tokens[session_token] = {"created_at": time.time()}
        logger.info("Novo token de sessão emitido para IP %s", client_ip)
        return jsonify({"session_token": session_token}), 200


def initialize_chat_websocket(socketio):

    @socketio.on("connect")
    def handle_connect(auth):
        sid = request.sid
        token = (auth or {}).get("token", "")

        _purge_expired_tokens()
        if token not in _valid_session_tokens:
            logger.warning("Conexão WebSocket recusada — token inválido (sid=%s)", sid)
            return False  # recusa a conexão

        _authenticated_sids.add(sid)
        logger.info("WebSocket autenticado (sid=%s)", sid)

    @socketio.on("disconnect")
    def handle_disconnect():
        sid = request.sid
        _authenticated_sids.discard(sid)
        _message_timestamps.pop(sid, None)

    def process_message(data, sid):
        mcp = MCPManager.get_instance()
        usecase = GenerateChatResponse()

        def emit(chunk):
            socketio.emit("chat_response", chunk, to=sid)

        try:
            resultado = mcp.submit(usecase(data, emit=emit))
            resultado.result()
        except Exception:
            logger.exception("Erro no WebSocket de chat — garantindo finalização")
            emit(json.dumps({"type": "error", "reply": "Não consegui gerar a resposta. Tente enviar sua mensagem de novo."}))
            emit(json.dumps({"type": "done", "reply": ""}))

    @socketio.on("chat_message")
    def handle_chat_message(data):
        sid = request.sid

        if sid not in _authenticated_sids:
            socketio.emit(
                "chat_response",
                json.dumps({"type": "error", "reply": "Sua sessão expirou. Recarregue a página para continuar."}),
                to=sid,
            )
            return

        if _is_rate_limited(sid):
            socketio.emit(
                "chat_response",
                json.dumps(
                    {
                        "type": "error",
                        "reply": f"Muitas mensagens seguidas. Aguarde alguns segundos e tente de novo.",
                    }
                ),
                to=sid,
            )
            return

        socketio.start_background_task(process_message, data, sid)

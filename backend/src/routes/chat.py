import json
import logging

from flask import request
from usecases.chat import GenerateChatResponse
from usecases.mcp_manager import MCPManager

logger = logging.getLogger(__name__)


def initialize_chat_websocket(socketio):

    def process_message(data, sid):
        mcp = MCPManager.get_instance()
        usecase = GenerateChatResponse()

        def emit(chunk):
            socketio.emit("chat_response", chunk, to=sid)

        try:
            resultado = mcp.submit(usecase(data, emit=emit))
            resultado.result()
        except Exception:
            logger.exception("Erro no WebSocket de chat")
            socketio.emit(
                "chat_response",
                json.dumps({"type": "error", "reply": "Falha ao processar mensagem."}),
                to=sid,
            )

    @socketio.on("chat_message")
    def handle_chat_message(data):
        sid = request.sid
        socketio.start_background_task(process_message, data, sid)

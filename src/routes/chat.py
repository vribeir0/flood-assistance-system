import json
import logging

from usecases.chat import GenerateChatResponse
from usecases.mcp_manager import MCPManager

logger = logging.getLogger(__name__)


def initialize_chat_websocket(socketio):

    def process_message(data):
        mcp = MCPManager.get_instance()
        usecase = GenerateChatResponse()

        def emit(chunk):
            socketio.emit("chat_response", chunk)

        try:
            resultado = mcp.submit(usecase(data, emit=emit))
            resultado.result()
        except Exception:
            logger.exception("Erro no WebSocket de chat")
            socketio.emit(
                "chat_response",
                json.dumps({"type": "error", "reply": "Falha ao processar mensagem."}),
            )

    @socketio.on("chat_message")
    def handle_chat_message(data):
        socketio.start_background_task(process_message, data)

import json
from usecases.chat import GenerateChatResponse
import asyncio


def initialize_chat_websocket(socketio):
    async def process_message(data):
        usecase = GenerateChatResponse()

        try:
            async for chunk in usecase(data):
                socketio.emit("chat_response", chunk)

        except Exception as e:
            print(e)
            socketio.emit(
                "chat_response",
                json.dumps({"type": "error", "reply": "Falha ao processar mensagem."}),
            )

    @socketio.on("chat_message")
    def handle_chat_message(data):
        socketio.start_background_task(lambda: asyncio.run(process_message(data)))

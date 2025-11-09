from routes.chat import initialize_chat_websocket


def init_routes(socketio):
    initialize_chat_websocket(socketio)

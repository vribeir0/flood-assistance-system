import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, request
from flask_socketio import SocketIO

# Carrega o .env antes de qualquer import que dependa de variáveis de ambiente
BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env", override=True)

sys.path.insert(0, str(BASE_DIR / "src"))

from routes.chat import initialize_chat_routes, initialize_chat_websocket
from settings import ALLOWED_ORIGINS, DEBUG
from usecases.mcp_manager import MCPManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = Flask(__name__)
app.config["DEBUG"] = DEBUG


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Vary"] = "Origin"
    return response


socketio = SocketIO(
    app,
    cors_allowed_origins=ALLOWED_ORIGINS,
    async_mode="threading",
)

initialize_chat_websocket(socketio)
initialize_chat_routes(app)

# Conexão MCP persistente
# Em modo debug o Flask cria um processo filho (reloader); só inicia o MCP lá.
if not DEBUG or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    mcp_manager = MCPManager.get_instance()
    mcp_manager.start()


if __name__ == "__main__":
    socketio.run(
        app, debug=DEBUG, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True
    )

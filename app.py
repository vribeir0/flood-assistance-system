import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask
from flask_socketio import SocketIO

# Carrega o .env da raiz do projeto explicitamente, antes de qualquer import
# que possa depender de variáveis de ambiente
BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

sys.path.insert(0, str(BASE_DIR / "src"))
from middlewares.cors import setup_cors
from routes import init_routes
from config import config


app = Flask(__name__)

setup_cors(app)

env = os.getenv("FLASK_ENV", "default")
app.config.from_object(config[env])

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading",
)

init_routes(socketio)


if __name__ == "__main__":
    socketio.run(app, debug=app.config["DEBUG"], host="0.0.0.0", port=5000)

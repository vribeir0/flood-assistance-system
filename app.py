import os
import sys
from dotenv import load_dotenv
from flask import Flask
from flask_restful import Api


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
from middlewares.cors import setup_cors
from routes import init_routes
from config import config


load_dotenv()

app = Flask(__name__)

setup_cors(app)

env = os.getenv("FLASK_ENV")
app.config.from_object(config[env])

api = Api(app)

init_routes(api)

if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"], host="0.0.0.0", port=4000)

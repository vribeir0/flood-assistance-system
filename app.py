import os
from dotenv import load_dotenv
from flask import Flask
from flask_restful import Api
from src.routes import init_routes
from config import config

load_dotenv()

app = Flask(__name__)

env = os.getenv("FLASK_ENV")
app.config.from_object(config[env])

api = Api(app)

init_routes(api)

if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"], host="0.0.0.0", port=4000)

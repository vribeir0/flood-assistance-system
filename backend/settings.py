import os
import pathlib

BASE_DIR = pathlib.Path(__file__).parent.absolute()

# Flask
DEBUG = os.getenv("FLASK_ENV") == "development"

# Google Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")

# Google Maps API
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GOOGLE_MAPS_API_URL = os.getenv("GOOGLE_MAPS_API_URL")

# Weather API
WEATHER_API_URL = os.getenv("WEATHER_API_URL")

# MCP Server
SERVER_PATH = os.path.join(BASE_DIR, os.getenv("SERVER_PATH", "server.py"))

TURNSTILE_SECRET_KEY = os.getenv("TURNSTILE_SECRET_KEY", "")

# CORS — origens permitidas (separadas por vírgula no .env)
# Exemplo: https://eventoshidrometereologicos.com.br,http://localhost
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

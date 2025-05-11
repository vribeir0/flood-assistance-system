import os
import pathlib
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the base directory of the project
BASE_DIR = pathlib.Path(__file__).parent.absolute()

# Google Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")

# Geocoding API
GEO_CODE_API_KEY = os.getenv("GEO_CODE_API_KEY")
GEO_CODE_API_URL = os.getenv("GEO_CODE_API_URL", "https://geocode.maps.co/search")

# Weather API
WEATHER_API_URL = os.getenv("WEATHER_API_URL", "https://api.open-meteo.com/v1/forecast")

# Server config
SERVER_PATH = os.path.join(BASE_DIR, os.getenv("SERVER_PATH", "server.py"))

# Databsase
DATA_DIR = BASE_DIR / "data"
DATABASE_URL = f"sqlite:///{DATA_DIR}/poc_mcp.db"

if not GEMINI_API_KEY:
    raise ValueError("A chave de API do Gemini não está configurada no arquivo .env")

if not GEO_CODE_API_KEY:
    raise ValueError("A chave de API de geocodificação não está configurada no arquivo .env")
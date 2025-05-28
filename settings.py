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

# Google Maps API
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GOOGLE_MAPS_API_URL = os.getenv("GOOGLE_MAPS_API_URL")

# Geocoding API
GEO_CODE_API_KEY = os.getenv("GEO_CODE_API_KEY")
GEO_CODE_API_URL = os.getenv("GEO_CODE_API_URL")

# Weather API
WEATHER_API_URL = os.getenv("WEATHER_API_URL")

# Server config
SERVER_PATH = os.path.join(BASE_DIR, os.getenv("SERVER_PATH", "server.py"))

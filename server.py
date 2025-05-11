from mcp.server.fastmcp import FastMCP

from pydantic import BaseModel
import requests
from typing import Optional

from settings import GEO_CODE_API_KEY, GEO_CODE_API_URL, WEATHER_API_URL


mcp = FastMCP('Geo')


class LatLon(BaseModel):
    lat: str
    lon: str
    
    
    
@mcp.tool()
def address_to_coordinates(location: Optional[str] = None) -> int:
    """Converts a address into geographic coordinates using the geocoding API.
    
    This tool takes a location string describing an address and returns the corresponding
    latitude and longitude coordinates in JSON format.
    
    Args:
        location (str): A string describing the location to geocode
    
    Returns:
        list[dict]: A JSON array of location matches, where each match contains:
            - lat: Latitude coordinate as string
            - lon: Longitude coordinate as string
"""
    
    params = {
        'q': location,
        'api_key': GEO_CODE_API_KEY,
    }
    response = requests.get(url=GEO_CODE_API_URL, params=params)
    
    return LatLon(**response.json()[0]).model_dump()

@mcp.tool()
async def get_weather(lat: float, lon: float) -> str:
    """Get weather for location."""
    
    url = WEATHER_API_URL
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "precipitation_probability_max",
        "hourly": "temperature_2m",
        "timezone": "auto",
        "forecast_days": 1
    }
    responses = requests.get(url, params=params)
    return responses.json()
    

if __name__ == "__main__":
    mcp.run(transport="stdio")
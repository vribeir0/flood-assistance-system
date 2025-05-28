from mcp.server.fastmcp import FastMCP

from pydantic import BaseModel, Field
import requests
from typing import  Optional


from settings import GEO_CODE_API_KEY, GEO_CODE_API_URL, GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_API_URL, WEATHER_API_URL


mcp = FastMCP('Geo')


class LatLon(BaseModel):
    latitude: str = Field(validation_alias="lat")
    longitude: str = Field(validation_alias="lon")
    
@mcp.tool()
def address_to_coordinates(location: Optional[str] = None) -> dict:
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
    if not response.json():
        raise ValueError("No location found")
    
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

@mcp.tool()
async def get_directions_with_steps(origin_waypoint: dict, final_waypoint: dict) -> dict:
    """Obtém instruções detalhadas de navegação entre dois pontos usando a API Google Maps.
    
    Esta ferramenta recebe as coordenadas de origem e destino e retorna informações
    detalhadas sobre a rota, incluindo instruções passo a passo para navegação.
    
    Args:
        origin_waypoint (dict): Coordenadas do ponto de origem no formato:
            {
                "latitude": "-25.456119",
                "longitude": "-49.285514"
            }
        final_waypoint (dict): Coordenadas do ponto de destino no mesmo formato.
    
    Returns:
        dict: Resposta da API do Google Maps contendo:
            - status (str): Status da solicitação
            - routes (list): Lista de rotas, onde cada rota contém:
                - legs (list): Segmentos da rota, onde cada segmento contém:
                    - steps (list): Lista de passos, onde cada passo contém:
                        - html_instructions (str): Instruções de navegação formatadas em HTML
                        - distance (dict): Distância deste passo
                        - duration (dict): Duração deste passo
                        - maneuver (str, opcional): Tipo de manobra (ex: "turn-right", "merge", etc.)
            - overview_polyline (dict): Representação codificada da rota completa para exibição em mapa
            - summary (str): Descrição resumida da rota
    """
    
    origin = f"{origin_waypoint['latitude']},{origin_waypoint['longitude']}"
    destination = f"{final_waypoint['latitude']},{final_waypoint['longitude']}"

    url = "https://maps.googleapis.com/maps/api/directions/json"
    
    params = {
        "origin": origin,
        "destination": destination,
        "mode": "driving",  
        "language": "pt-BR",  
        "key": GOOGLE_MAPS_API_KEY
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code != 200:
        return {"error": f"Falha na requisição: {response.status_code}", "details": response.text}
    
    result = response.json()
    
    return result

if __name__ == "__main__":
    mcp.run(transport="stdio")
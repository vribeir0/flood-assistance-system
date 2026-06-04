import logging

import requests
from mcp.server.fastmcp import FastMCP

from settings import (
    GEO_CODE_API_KEY,
    GEO_CODE_API_URL,
    GOOGLE_MAPS_API_KEY,
    GOOGLE_MAPS_API_URL,
    WEATHER_API_URL,
)

logger = logging.getLogger(__name__)

mcp = FastMCP("Geo")


@mcp.tool()
async def geocode_address(address: str) -> dict:
    """Converte um endereço textual em coordenadas geográficas (latitude e longitude).

    Use esta ferramenta sempre que o usuário fornecer um endereço textual e não houver
    coordenadas disponíveis no contexto. O resultado deve ser usado nas demais ferramentas
    que exigem latitude e longitude.

    Args:
        address (str): Endereço completo ou parcial a ser geocodificado — extraído literalmente
            do texto do usuário, sem adicionar caracteres extras, prefixos ou sufixos.
            Passe apenas a parte que representa o endereço, removendo qualquer texto irrelevante.
            Exemplos: "Rua XV de Novembro, 1000, Curitiba", "Av. Paulista, São Paulo"

    Returns:
        dict: Resultado da geocodificação contendo:
            - latitude (float): Latitude do endereço.
            - longitude (float): Longitude do endereço.
            - display_name (str): Endereço formatado encontrado pela API.
          Ou em caso de erro:
            - error (str): Descrição do problema.
    """
    params = {"address": address, "key": GEO_CODE_API_KEY}
    response = requests.get(GEO_CODE_API_URL, params=params)
    logger.info(
        "Geocoding API status=%s body=%s", response.status_code, response.text[:300]
    )

    if response.status_code != 200:
        return {
            "error": f"Falha na requisição: {response.status_code} — {response.text[:200]}"
        }

    data = response.json()
    results = data.get("results", [])
    if not results:
        return {"error": f"Nenhum resultado encontrado para o endereço: {address}"}

    best = results[0]
    loc = best["geometry"]["location"]
    return {
        "latitude": loc["lat"],
        "longitude": loc["lng"],
        "display_name": best.get("formatted_address", ""),
    }


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
        "forecast_days": 1,
    }
    responses = requests.get(url, params=params)
    return responses.json()


@mcp.tool()
async def get_directions_with_steps(
    origin_waypoint: dict, final_waypoint: dict
) -> dict:
    """Obtém instruções detalhadas de navegação entre dois pontos usando a API Google Maps.

    Esta ferramenta recebe as coordenadas de origem e destino e retorna informações
    detalhadas sobre a rota, incluindo instruções passo a passo para navegação.

    Args:
        origin_waypoint (dict): Coordenadas do ponto de origem no formato:
            {
                "latitude": "-25.4284",
                "longitude": "-49.2733"
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
            - summary (str): Descrição resumida da rota
            - maps_link (str): Link direto para abrir a rota no Google Maps
    """

    origin = f"{origin_waypoint['latitude']},{origin_waypoint['longitude']}"
    destination = f"{final_waypoint['latitude']},{final_waypoint['longitude']}"

    url = GOOGLE_MAPS_API_URL

    params = {
        "origin": origin,
        "destination": destination,
        "mode": "driving",
        "language": "pt-BR",
        "key": GOOGLE_MAPS_API_KEY,
    }

    response = requests.get(url, params=params)
    logger.info("Google Maps API status: %s", response.status_code)
    if response.status_code != 200:
        return {
            "error": f"Falha na requisição: {response.status_code}",
            "details": response.text,
        }

    result = response.json()

    maps_link = (
        f"https://www.google.com/maps/dir/?api=1"
        f"&origin={origin}"
        f"&destination={destination}"
        f"&travelmode=driving"
    )
    result["maps_link"] = maps_link

    return result


if __name__ == "__main__":
    mcp.run(transport="stdio")

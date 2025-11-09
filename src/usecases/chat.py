import os
from flask import json
from langchain_google_genai import ChatGoogleGenerativeAI
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langgraph.prebuilt import create_react_agent
from langchain_mcp_adapters.tools import load_mcp_tools

from settings import GEMINI_API_KEY, GEMINI_MODEL, SERVER_PATH

server_params = StdioServerParameters(
    command="python",
    args=["server.py"],
    env={
        **os.environ,
    },
)


class GenerateChatResponse:
    async def __call__(self, data: dict):
        message = data.get("message", "")
        latitude = data.get("latitude")
        longitude = data.get("longitude")

        user_context = {
            "mensagem": message,
            "latitude": latitude,
            "longitude": longitude,
        }

        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()

                tools = await load_mcp_tools(session)
                streaming_model = ChatGoogleGenerativeAI(
                    google_api_key=GEMINI_API_KEY,
                    model=GEMINI_MODEL,
                    temperature=0,
                )

                agent = create_react_agent(streaming_model, tools)
                improved_prompt = {
                    "messages": [
                        {
                            "role": "system",
                            "content": """Você é um assistente de emergência especializado em situações de alagamento. 
                        
                        O usuário fornecerá:
                        1. Uma mensagem descrevendo sua situação
                        2. Suas coordenadas geográficas atuais (latitude e longitude)
                       
                        Siga rigorosamente esta sequência de passos para ajudar o usuário:
                        1. Caso o usuário envie um endereço utilize esse endereço para o restante das instruções, ao contrário utilize as coordenadas enviadas pelo usuário.
                        2. Em seguida, obtenha e analise as condições meteorológicas atuais nessa localização
                        4. Por fim, calcule a rota e o tempo de deslocamento entre os dois pontos

                        IMPORTANTE:
                        - Não mostre ao usuário os formatos JSON ou dicionários que você recebe das ferramentas.
                        - Sempre apresente as informações em linguagem natural, clara e direta.
                        - É ESSENCIAL incluir TODAS as instruções de navegação passo a passo.
                        - Formate as instruções de rota como uma lista numerada de passos fácil de seguir.
                        - Remova tags HTML como <div>, <b> e <wbr> das instruções.
                        - Sempre apresente um resumo com a distância total e o tempo estimado de viagem.

                        Sua resposta DEVE incluir:
                        1. Condições meteorológicas atuais
                        2. Avaliação de risco de chuva forte
                        3. Distância total e tempo de viagem
                        4. Instruções detalhadas passo a passo para seguir a rota

                        EXEMPLO de resposta com instruções de rota:

                        Condições meteorológicas: Temperatura de 23°C sem previsão de chuva.

                        Rota até o local seguro:
                        1. Siga na direção sudoeste para a R. Mato Grosso. (32 m)
                        2. Vire à direita na Tv. Ferreira do Amaral. (500 m)
                        3. Pegue a R. Saint Hilaire (0,6 km)
                        4. Vire à direita na Av. Silva Jardim (0,2 km)
                        5. Continue na Av. Silva Jardim até o destino (1,6 km)

                        A distância total até o destino é de 2,9 km e o tempo estimado de viagem é de 7 minutos.
                        """,
                        },
                        {
                            "role": "user",
                            "content": json.dumps(user_context),
                        },
                    ]
                }
                async for event in agent.astream_events(improved_prompt):
                    if event["event"] == "on_chat_model_stream":
                        content = event["data"]["chunk"].content
                        if content:
                            data = json.dumps({"type": "token", "reply": content})
                            yield data

                data = json.dumps({"type": "done", "reply": ""})
                yield data

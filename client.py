from langchain_google_genai import ChatGoogleGenerativeAI
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langgraph.prebuilt import create_react_agent
from langchain_mcp_adapters.tools import load_mcp_tools

from settings import GEMINI_API_KEY, GEMINI_MODEL, SERVER_PATH


from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.tracers import ConsoleCallbackHandler


model = ChatGoogleGenerativeAI(
    google_api_key=GEMINI_API_KEY, model=GEMINI_MODEL, temperature=0
)

server_params = StdioServerParameters(
    command="python",
    args=[SERVER_PATH],
)

callback_manager = CallbackManager([
    StreamingStdOutCallbackHandler(),
    ConsoleCallbackHandler()
])

async def run_agent():
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            tools = await load_mcp_tools(session)
            
            streaming_model = ChatGoogleGenerativeAI(
                google_api_key=GEMINI_API_KEY, 
                model=GEMINI_MODEL, 
                temperature=0,
                streaming=True,
                callback_manager=callback_manager
            )
            
            agent = create_react_agent(streaming_model, tools)
            
            improved_prompt = {
                "messages": [
                    {
                        "role": "system",
                        "content": """Você é um assistente de emergência especializado em situações de alagamento. 
                    Siga rigorosamente esta sequência de passos para ajudar o usuário:
                    1. Primeiro, converta o endereço atual do usuário em coordenadas geográficas
                    2. Em seguida, obtenha e analise as condições meteorológicas atuais nessa localização
                    3. Depois, converta o endereço de destino em coordenadas geográficas
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
                        "content": """Estou em uma área com risco de alagamento e preciso de informações urgentes.

                    Minha localização atual: Avenida República Argentina, 1927 - Água Verde, Curitiba - PR
                    
                    Meu destino (local seguro): Av. Sete de Setembro, 3165, Curitiba, Paraná, Brasil

                    Por favor:
                    1. Verifique as condições meteorológicas na minha localização atual
                    2. Determine se há risco imediato de chuva forte
                    3. Calcule a rota mais rápida até o destino
                    4. Informe quanto tempo levarei para chegar ao local seguro"""
                    },
                ]
            }
            
            response = await agent.ainvoke(improved_prompt)
            output_text = response["messages"][-1].content
            print(output_text)




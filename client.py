from langchain_google_genai import ChatGoogleGenerativeAI
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langgraph.prebuilt import create_react_agent
from langchain_mcp_adapters.tools import load_mcp_tools

from settings import GEMINI_API_KEY, GEMINI_MODEL, SERVER_PATH




model = ChatGoogleGenerativeAI(google_api_key=GEMINI_API_KEY, model=GEMINI_MODEL, temperature=0)

server_params = StdioServerParameters(
    command="python",
    args=[SERVER_PATH],
)

async def run_agent():
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            tools = await load_mcp_tools(session)
            
            agent = create_react_agent(model, tools)
            response = await agent.ainvoke({"messages": "Give me the weather of this address: Av. Sete de Setembro, 3165, Curitiba, Paraná"})
            return response



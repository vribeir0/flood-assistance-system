import os
from flask import json
from langchain_google_genai import ChatGoogleGenerativeAI
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langgraph.prebuilt import create_react_agent
from langchain_mcp_adapters.tools import load_mcp_tools

from settings import GEMINI_API_KEY, GEMINI_MODEL
from prompts.chat import SYSTEM_PROMPT

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
                agent = self._build_agent(tools)
                improved_prompt = {
                    "messages": [
                        {
                            "role": "system",
                            "content": SYSTEM_PROMPT,
                        },
                        {
                            "role": "user",
                            "content": json.dumps(user_context, ensure_ascii=False),
                        },
                    ]
                }
                async for event in agent.astream_events(improved_prompt):
                    if event["event"] == "on_chat_model_stream":
                        content = event["data"]["chunk"].content
                        if content:
                            data = json.dumps({"type": "token", "reply": content})
                            yield data

                yield json.dumps({"type": "done", "reply": ""})

    def _build_agent(self, tools):
        model = ChatGoogleGenerativeAI(
            google_api_key=GEMINI_API_KEY,
            model=GEMINI_MODEL,
            temperature=0,
        )
        return create_react_agent(model, tools)

import json
import logging

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

from prompts.chat import SYSTEM_PROMPT
from settings import GEMINI_API_KEY, GEMINI_MODEL
from usecases.mcp_manager import MCPManager

logger = logging.getLogger(__name__)


class GenerateChatResponse:
    """Processa a mensagem do usuário e faz streaming da rsposta"""

    async def __call__(self, data: dict, *, emit):
        user_context = {
            "mensagem": data.get("message", ""),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
        }

        mcp = MCPManager.get_instance()
        model = ChatGoogleGenerativeAI(
            google_api_key=GEMINI_API_KEY,
            model=GEMINI_MODEL,
            temperature=0,
        )
        agent = create_react_agent(model, mcp.tools)

        prompt = {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": json.dumps(user_context, ensure_ascii=False),
                },
            ]
        }

        async for event in agent.astream_events(prompt):
            if event["event"] == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    emit(json.dumps({"type": "token", "reply": content}))

        emit(json.dumps({"type": "done", "reply": ""}))

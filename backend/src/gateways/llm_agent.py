from collections.abc import Callable

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

from settings import GEMINI_API_KEY, GEMINI_MODEL


class LLMAgent:

    def __init__(self, tools: list) -> None:
        model = ChatGoogleGenerativeAI(
            google_api_key=GEMINI_API_KEY,
            model=GEMINI_MODEL,
            temperature=0,
        )
        self._agent = create_react_agent(model, tools)

    async def stream_response(
        self, prompt: dict, on_token: Callable[[str], None]
    ) -> None:
        """Executa o agente e chama on_token para cada trecho de conteúdo que retorna.

        Não devolve a resposta completa — quem chama é responsável por montar
        ou emitir os tokens conforme chegam.
        """
        async for event in self._agent.astream_events(prompt):
            if event["event"] == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    on_token(content)

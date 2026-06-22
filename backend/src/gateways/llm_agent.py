import logging
from collections.abc import Callable

from langchain_core.messages import AIMessageChunk
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

from settings import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)


class LLMAgent:

    def __init__(self, tools: list) -> None:
        model = ChatGoogleGenerativeAI(
            google_api_key=GEMINI_API_KEY,
            model=GEMINI_MODEL,
            temperature=1,
            thinking_level="low",
        )
        self._agent = create_react_agent(model, tools)

    async def stream_response(
        self, prompt: dict, on_token: Callable[[str], None]
    ) -> None:
        """Executa o agente e chama on_token para cada trecho de conteúdo que retorna.

        Não devolve a resposta completa — quem chama é responsável por montar
        ou emitir os tokens conforme chegam.
        """
        try:
            async for msg, _metadata in self._agent.astream(
                prompt, stream_mode="messages"
            ):
                logger.debug(
                    "Chunk recebido: type=%s content_type=%s",
                    type(msg).__name__,
                    type(getattr(msg, "content", None)).__name__,
                )
                if not isinstance(msg, AIMessageChunk):
                    continue
                content = msg.content
                if isinstance(content, str) and content:
                    on_token(content)
        except Exception:
            logger.exception("Erro durante streaming do agente")
            raise

import json
import logging

from domain.chat import ChatRequest
from gateways.llm_agent import LLMAgent
from prompts.chat import SYSTEM_PROMPT
from usecases.mcp_manager import MCPManager

logger = logging.getLogger(__name__)


def _build_prompt(request: ChatRequest) -> dict:
    """Monta a lista de mensagens: system prompt primeiro, depois o histórico da conversa,
    e por último a nova mensagem do usuário.
    """
    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            *[{"role": msg.role, "content": msg.content} for msg in request.history],
            {"role": "user", "content": request.to_user_context().to_json()},
        ]
    }


class GenerateChatResponse:
    """Ponto de entrada para uma mensagem do chat. Converte os dados de entrada, cria o agente
    e transmite a resposta de volta pelo emit.
    """

    async def __call__(self, data: dict, *, emit) -> None:
        request = ChatRequest.from_dict(data)
        agent = LLMAgent(MCPManager.get_instance().tools)
        prompt = _build_prompt(request)

        try:
            await agent.stream_response(
                prompt,
                on_token=lambda content: emit(
                    json.dumps({"type": "token", "reply": content})
                ),
            )
        except Exception:
            logger.exception("Erro ao gerar resposta do chat")
            emit(
                json.dumps(
                    {"type": "error", "reply": "Não consegui gerar a resposta. Tente enviar sua mensagem de novo."}
                )
            )
            return
        finally:
            emit(json.dumps({"type": "done", "reply": ""}))

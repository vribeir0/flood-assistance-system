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
    # Constrói informações de contexto para adicionar ao system prompt
    context_lines = []
    if request.test_mode:
        context_lines.append(
            "MODO TESTE ATIVO: O sistema está em modo de teste. O risco deve ser tratado como ALTO, independentemente das condições meteorológicas reais."
        )

    context_section = ""
    if context_lines:
        context_section = "\n\n---\n\n# Contexto do Usuário\n\n" + "\n".join(
            context_lines
        )

    system_prompt_with_context = SYSTEM_PROMPT + context_section

    return {
        "messages": [
            {"role": "system", "content": system_prompt_with_context},
            *[{"role": msg.role, "content": msg.content} for msg in request.history],
            {"role": "user", "content": request.message},
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
                    {
                        "type": "error",
                        "reply": "Não consegui gerar a resposta. Tente enviar sua mensagem de novo.",
                    }
                )
            )
            return
        finally:
            emit(json.dumps({"type": "done", "reply": ""}))

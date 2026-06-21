import asyncio
import logging
import os
import sys
import threading

from langchain_mcp_adapters.tools import load_mcp_tools
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from settings import SERVER_PATH

logger = logging.getLogger(__name__)

server_params = StdioServerParameters(
    command=sys.executable,
    args=[SERVER_PATH],
    env={**os.environ},
)


class MCPManager:
    """Singleton que mantém o processo do servidor MCP ativo e expõe suas ferramentas.
    Inicialize uma vez na inicialização da aplicação; todo o resto usa get_instance().
    """

    _instance = None

    def __init__(self) -> None:
        self._loop: asyncio.AbstractEventLoop | None = None
        self._tools = None
        self._ready = threading.Event()

    @classmethod
    def get_instance(cls) -> "MCPManager":
        """Retorna o MCPManager compartilhado, criando-o na primeira chamada."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def start(self) -> None:
        """Cria uma thread daemon com seu próprio event loop, conecta ao servidor MCP
        e bloca até as ferramentas estarem prontas (timeout de 30 s).
        """
        self._loop = asyncio.new_event_loop()
        self._ready.clear()

        thread = threading.Thread(
            target=self._loop.run_until_complete,
            args=(self._keep_alive(),),
            name="mcp-event-loop",
            daemon=True,
        )
        thread.start()

        if not self._ready.wait(timeout=30):
            raise RuntimeError("Servidor MCP não inicializou em 30s")

        logger.info("Conexão MCP pronta — tools: %s", [t.name for t in self._tools])

    async def _keep_alive(self) -> None:
        """Abre a conexão stdio, carrega as ferramentas e sinaliza que está pronto.
        Se a conexão cair, tenta reconectar automaticamente a cada 2 segundos.
        """
        first_connect = True
        while True:
            try:
                async with stdio_client(server_params) as (read, write):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        self._tools = await load_mcp_tools(session)
                        if first_connect:
                            self._ready.set()
                            first_connect = False
                        await asyncio.Event().wait()
            except Exception:
                logger.warning(
                    "Conexão MCP perdida. Tentando reconectar em 2s...",
                    exc_info=True,
                )
                await asyncio.sleep(2)

    @property
    def tools(self):
        return self._tools

    def submit(self, coro):
        """Agenda uma coroutine no event loop do MCP a partir de qualquer thread.
        Retorna um Future.
        """
        return asyncio.run_coroutine_threadsafe(coro, self._loop)

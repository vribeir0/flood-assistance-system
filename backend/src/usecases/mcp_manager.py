import asyncio
import logging
import os
import threading

from langchain_mcp_adapters.tools import load_mcp_tools
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from settings import SERVER_PATH

logger = logging.getLogger(__name__)

server_params = StdioServerParameters(
    command="python",
    args=[SERVER_PATH],
    env={**os.environ},
)


class MCPManager:
    """Mantém a conexão MCP aberta."""

    _instance = None

    def __init__(self) -> None:
        self._loop: asyncio.AbstractEventLoop | None = None
        self._tools = None
        self._ready = threading.Event()

    @classmethod
    def get_instance(cls):
        """Retorna a uma única instância do mcp"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def start(self):
        """Inicia a thread e conecta ao mcp"""
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
        """Abre a conexão MCP e a mantém executando"""
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                self._tools = await load_mcp_tools(session)
                self._ready.set()

                await asyncio.Event().wait()

    @property
    def tools(self):
        return self._tools

    def submit(self, coro):
        return asyncio.run_coroutine_threadsafe(coro, self._loop)

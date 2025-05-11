
import asyncio

from client import run_agent


if __name__ == "__main__":
    result = asyncio.run(run_agent())
    print(result["messages"][-1].content)
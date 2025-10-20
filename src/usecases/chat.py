import json
import time
from typing import Optional

from pydantic import BaseModel


class StreamingResponse(BaseModel):
    type: str
    reply: Optional[str] = None


class GenerateChatResponse:
    def __call__(self, message: str):
        test_message = f"resposta para a mensagem: {message}"

        for test_word in test_message.split():
            data = StreamingResponse(type="msg", reply=test_word + " ")
            yield f"data: {data.model_dump_json()}\n\n"
            time.sleep(0.3)

        finished_response = StreamingResponse(type="done")
        yield f"data: {finished_response.model_dump_json()}\n\n"

from flask import Response, request
from flask_restful import Resource

from usecases.chat import GenerateChatResponse


class ChatResource(Resource):
    def get(self):
        message = request.args.get("message", "")

        usecase = GenerateChatResponse()

        response = Response(
            usecase(message),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

        return response

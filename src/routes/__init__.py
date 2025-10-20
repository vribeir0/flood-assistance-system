from routes.chat import ChatResource


def init_routes(api):
    api.add_resource(ChatResource, "/api/chat")

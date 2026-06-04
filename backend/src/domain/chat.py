from pydantic import BaseModel


class HistoryMessage(BaseModel):
    role: str
    content: str


class UserContext(BaseModel):
    mensagem: str
    latitude: float | None = None
    longitude: float | None = None
    modo_teste: bool = False

    def to_json(self) -> str:
        return self.model_dump_json()


class ChatRequest(BaseModel):

    message: str
    latitude: float | None = None
    longitude: float | None = None
    test_mode: bool = False
    history: list[HistoryMessage] = []

    @classmethod
    def from_dict(cls, data: dict) -> "ChatRequest":
        history = [
            HistoryMessage(
                role="user" if msg.get("source") == "user" else "assistant",
                content=msg.get("text", ""),
            )
            for msg in data.get("history", [])
        ]
        return cls(
            message=data.get("message", ""),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            test_mode=data.get("test_mode", False),
            history=history,
        )

    def to_user_context(self) -> UserContext:
        return UserContext(
            mensagem=self.message,
            latitude=self.latitude,
            longitude=self.longitude,
            modo_teste=self.test_mode,
        )

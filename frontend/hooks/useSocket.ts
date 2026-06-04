import { useEffect, useRef, useState } from "react";
import { chatService } from "@/services/chatService";
import { ChatPayload, Message } from "@/types/chat";
import { Socket } from "socket.io-client";

export type { ChatPayload };

type UseSocketResult = {
  messages: Message[];
  isStreaming: boolean;
  streamResponse: string;
  sessionExpired: boolean;
  sendMessage: (payload: ChatPayload) => void;
};

const SESSION_KEYS = [
  "captcha_verified",
  "captcha_session_token",
  "captcha_session_created_at",
];

function clearSession() {
  if (typeof localStorage !== "undefined") {
    SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  }
}

function parseResponse(data: unknown) {
  if (typeof data === "string") return JSON.parse(data);
  if (typeof data === "object" && data !== null && "data" in data) {
    const d = data as { data: unknown };
    if (typeof d.data === "string") return JSON.parse(d.data);
  }
  return data;
}

export function useSocket(): UseSocketResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamResponse, setStreamResponse] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = chatService.createWebSocket();
    const socket = socketRef.current;

    socket.on("connect_error", (error) => {
      console.error("Erro de conexão:", error);
      if (error.message?.includes("rejected")) {
        socket.disconnect();
        clearSession();
        setSessionExpired(true);
      }
    });

    socket.on("reconnect_failed", () => {
      clearSession();
      setSessionExpired(true);
    });

    socket.on("chat_response", (data) => {
      try {
        const response = parseResponse(data) as {
          type: string;
          reply?: string;
        };
        // Chunks de resposta
        if (response.type === "token") {
          setStreamResponse((prev) => prev + (response.reply ?? ""));
          setIsStreaming(true);
          // Resposta completa
        } else if (response.type === "done") {
          setIsStreaming(false);
          setStreamResponse((current) => {
            if (current.trim()) {
              setMessages((prev) => [...prev, Message.fromSystem(current)]);
            }
            return "";
          });
        } else if (response.type === "error") {
          setIsStreaming(false);
          setStreamResponse("");
          setMessages((prev) => [
            ...prev,
            Message.fromSystem(response.reply ?? "Erro desconhecido."),
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          Message.fromSystem("Erro ao processar resposta."),
        ]);
        setIsStreaming(false);
        setStreamResponse("");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (payload: ChatPayload) => {
    if (!socketRef.current) return;
    setMessages((prev) => [...prev, Message.fromUser(payload.message)]);
    socketRef.current.emit("chat_message", payload);
    setIsStreaming(true);
  };

  return { messages, isStreaming, streamResponse, sessionExpired, sendMessage };
}

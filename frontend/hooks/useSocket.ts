import { useEffect, useRef, useState, useCallback } from "react";
import { chatService } from "@/services/chatService";
import { ChatPayload, Message } from "@/types/chat";
import { Socket } from "socket.io-client";

export type { ChatPayload };

const STREAM_TIMEOUT_MS = 60_000;

type UseSocketResult = {
  messages: Message[];
  isStreaming: boolean;
  streamResponse: string;
  connectionLost: boolean;
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

const WELCOME_MESSAGE =
  "Olá! Sou seu assistente de emergência para situações de alagamento. " +
  "Posso informar as condições climáticas da sua região, avaliar riscos e gerar rotas de evacuação. " +
  "Como posso ajudar?\n\n" +
  "**Modo de teste disponível:** Ative o botão \"Modo Teste\" no topo da tela " +
  "para simular uma situação de risco com alta probabilidade de alagamento, " +
  "independente das condições reais.";

export function useSocket(): UseSocketResult {
  const [messages, setMessages] = useState<Message[]>([
    Message.fromSystem(WELCOME_MESSAGE),
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamResponse, setStreamResponse] = useState("");
  const [connectionLost, setConnectionLost] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsStreaming(false);
      setStreamResponse((current) => {
        if (current.trim()) {
          setMessages((prev) => [...prev, Message.fromSystem(current)]);
        }
        return "";
      });
    }, STREAM_TIMEOUT_MS);
  }, []);

  const clearStreamTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    socketRef.current = chatService.createWebSocket();
    const socket = socketRef.current;

    socket.on("connect_error", (error) => {
      console.error("Erro de conexão:", error);
      if (error.message?.includes("rejected")) {
        socket.disconnect();
        clearSession();
      }
      setConnectionLost(true);
    });

    socket.on("reconnect_failed", () => {
      clearSession();
      setConnectionLost(true);
    });

    socket.on("connect", () => {
      setConnectionLost(false);
    });

    socket.on("chat_response", (data) => {
      try {
        const response = parseResponse(data) as {
          type: string;
          reply?: string;
        };
        if (response.type === "token") {
          setStreamResponse((prev) => prev + (response.reply ?? ""));
          setIsStreaming(true);
          resetTimeout();
        } else if (response.type === "done") {
          clearStreamTimeout();
          setIsStreaming(false);
          setStreamResponse((current) => {
            if (current.trim()) {
              setMessages((prev) => [...prev, Message.fromSystem(current)]);
            }
            return "";
          });
        } else if (response.type === "error") {
          clearStreamTimeout();
          setIsStreaming(false);
          setStreamResponse("");
          setMessages((prev) => [
            ...prev,
            Message.fromSystem(response.reply ?? "Erro desconhecido."),
          ]);
        }
      } catch {
        clearStreamTimeout();
        setMessages((prev) => [
          ...prev,
          Message.fromSystem("Erro ao processar resposta."),
        ]);
        setIsStreaming(false);
        setStreamResponse("");
      }
    });

    return () => {
      clearStreamTimeout();
      socket.disconnect();
    };
  }, [resetTimeout, clearStreamTimeout]);

  const sendMessage = (payload: ChatPayload) => {
    if (!socketRef.current) return;
    setMessages((prev) => [...prev, Message.fromUser(payload.message)]);
    socketRef.current.emit("chat_message", payload);
    setIsStreaming(true);
    resetTimeout();
  };

  return { messages, isStreaming, streamResponse, connectionLost, sendMessage };
}

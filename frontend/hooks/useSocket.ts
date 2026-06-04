import { useEffect, useRef, useState, useCallback } from "react";
import { chatService } from "@/services/chatService";
import { ChatPayload, Message } from "@/types/chat";
import { Socket } from "socket.io-client";

const STREAM_TIMEOUT_MS = 60_000;

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

const WELCOME_MESSAGE =
  "Olá! Posso consultar o clima da sua região, avaliar o risco de alagamento " +
  "e gerar uma rota de evacuação se for necessário. Como posso ajudar?\n\n" +
  "Se quiser testar o sistema em um cenário de emergência, ative o " +
  '"Modo Teste" no topo da tela.';

export function useSocket() {
  const [messages, setMessages] = useState<Message[]>([
    Message.fromSystem(WELCOME_MESSAGE),
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamResponse, setStreamResponse] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<ChatPayload | null>(null);

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
        setMessages((prev) => [
          ...prev,
          Message.fromSystem("Sua sessão expirou. Recarregue a página para continuar."),
        ]);
      }
    });

    socket.on("reconnect_failed", () => {
      clearSession();
      setMessages((prev) => [
        ...prev,
        Message.fromSystem("Não foi possível reconectar. Recarregue a página para continuar."),
      ]);
    });

    socket.on("connect", () => {
      if (pendingPayloadRef.current) {
        const payload = pendingPayloadRef.current;
        pendingPayloadRef.current = null;
        socket.emit("chat_message", payload);
        setIsStreaming(true);
        resetTimeout();
      }
    });

    socket.on("disconnect", () => {
      clearStreamTimeout();
      setIsStreaming(false);
      setStreamResponse((current) => {
        if (current.trim()) {
          setMessages((prev) => [...prev, Message.fromSystem(current)]);
        }
        return "";
      });
    });

    socket.on("chat_response", (data) => {
      try {
        const response = JSON.parse(data) as {
          type: string;
          reply?: string;
        };
        if (response.type === "token") {
          pendingPayloadRef.current = null;
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
            Message.fromSystem(response.reply ?? "Ocorreu um erro inesperado."),
          ]);
        }
      } catch {
        clearStreamTimeout();
        setMessages((prev) => [
          ...prev,
          Message.fromSystem("Não foi possível processar a resposta."),
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

    if (!socketRef.current.connected) {
      pendingPayloadRef.current = payload;
      socketRef.current.connect();
      return;
    }

    pendingPayloadRef.current = payload;
    socketRef.current.emit("chat_message", payload);
    setIsStreaming(true);
    resetTimeout();
  };

  return { messages, isStreaming, streamResponse, sendMessage };
}

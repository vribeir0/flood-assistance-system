import { useEffect, useRef, useState, useCallback } from "react";
import { chatService } from "@/services/chatService";
import { clearSession } from "@/helpers/session";
import { ChatPayload, Message } from "@/types/chat";
import { Socket } from "socket.io-client";

const STREAM_TIMEOUT_MS = 60_000;

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

  const finishStream = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsStreaming(false);
    setStreamResponse((current) => {
      if (current.trim()) {
        setMessages((prev) => [...prev, Message.fromSystem(current)]);
      }
      return "";
    });
  }, []);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(finishStream, STREAM_TIMEOUT_MS);
  }, [finishStream]);

  useEffect(() => {
    socketRef.current = chatService.createWebSocket();
    const socket = socketRef.current;

    socket.on("connect_error", (error) => {
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

    socket.on("disconnect", finishStream);

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
          finishStream();
        } else if (response.type === "error") {
          finishStream();
          setMessages((prev) => [
            ...prev,
            Message.fromSystem(response.reply ?? "Ocorreu um erro inesperado."),
          ]);
        }
      } catch {
        finishStream();
        setMessages((prev) => [
          ...prev,
          Message.fromSystem("Não foi possível processar a resposta."),
        ]);
      }
    });

    return () => {
      finishStream();
      socket.disconnect();
    };
  }, [resetTimeout, finishStream]);

  const sendMessage = (payload: ChatPayload) => {
    if (!socketRef.current) return;

    setMessages((prev) => [...prev, Message.fromUser(payload.message)]);
    pendingPayloadRef.current = payload;

    if (!socketRef.current.connected) {
      socketRef.current.connect();
      return;
    }

    socketRef.current.emit("chat_message", payload);
    setIsStreaming(true);
    resetTimeout();
  };

  return { messages, isStreaming, streamResponse, sendMessage };
}

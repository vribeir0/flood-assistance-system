import { ChatResponse } from "@/types/chat";
import { Socket } from "socket.io-client";
import { api, createSocket } from "./api";

const SESSION_TOKEN_KEY = "captcha_session_token";

export const chatService = {
  sendMessage: async (message: string): Promise<ChatResponse> => {
    try {
      const response = await api.post<ChatResponse>("/chat", {
        message,
      });
      return response.data;
    } catch (error) {
      throw new Error("Erro ao enviar mensagem para o backend");
    }
  },

  createWebSocket: (): Socket => {
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(SESSION_TOKEN_KEY) ?? undefined
        : undefined;
    return createSocket(token);
  },
};

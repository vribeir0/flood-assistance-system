import axios from "axios";
import { io, Socket } from "socket.io-client";

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createSocket = (): Socket => {
  const socket = io(API_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
  return socket;
};

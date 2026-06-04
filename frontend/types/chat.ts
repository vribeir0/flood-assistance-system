export type MessageSource = "user" | "system";

export interface Message {
  text: string;
  source: MessageSource;
  timestamp: number;
}

export interface HistoryEntry {
  text: string;
  source: MessageSource;
}

export interface ChatPayload {
  message: string;
  history: HistoryEntry[];
  latitude?: number;
  longitude?: number;
}

export const Message = {
  fromUser: (text: string): Message => ({
    text,
    source: "user",
    timestamp: Date.now(),
  }),
  fromSystem: (text: string): Message => ({
    text,
    source: "system",
    timestamp: Date.now(),
  }),
};

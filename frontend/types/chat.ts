export interface Message {
  text: string;
  source: "user" | "system";
  timestamp: number;
}

export interface ChatResponse {
  reply: string;
  timestamp: number;
}

export interface ChatHistory {
  question: Message;
  answer: Message;
}

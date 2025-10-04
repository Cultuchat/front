import type { Event } from "./event";

export type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  events?: Event[];
  quickActions?: string[];
};

export type SuggestedQuestion = {
  id: string;
  question: string;
  category: string;
};

export type ChatConversation = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
};

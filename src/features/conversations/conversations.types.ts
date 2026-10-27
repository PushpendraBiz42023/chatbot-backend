export interface ConversationDto {
  id: string;
  title: string | null;
  activeProvider: string;
  activeModel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDto {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

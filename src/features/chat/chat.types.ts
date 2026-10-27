import { ChatMessage } from "../../services/ai/ai.types";
import { FallbackOption } from "../../services/ai/provider-unavailable.error";

export interface ChatStreamInput {
  message: string;
  history: ChatMessage[];
  conversationId: string;
  userId: string;
  activeProvider: string;
  signal?: AbortSignal;
}

export type ChatStreamEvent =
  // Emitted once, before any `chunk`, so the client learns the real
  // conversationId immediately (needed for a brand-new chat, whose id didn't
  // exist until this request created it).
  | { type: "meta"; conversationId: string }
  | { type: "chunk"; content: string }
  | { type: "done" }
  | { type: "error"; code: "AI_PROVIDER_ERROR"; message: string }
  | {
      type: "provider_unavailable";
      code: "PROVIDER_UNAVAILABLE";
      provider: string;
      model: string;
      fallbackOptions: FallbackOption[];
    };

import { streamForConversation } from "../../services/ai/provider-manager";
import { ProviderUnavailableError } from "../../services/ai/provider-unavailable.error";
import { retrieveGroundingContext } from "../../services/rag/retrieval";
import { CHAT_SYSTEM_PROMPT, RAG_GROUNDING_FRAMING } from "./chat.constants";
import { ChatStreamEvent, ChatStreamInput } from "./chat.types";

/**
 * Best-effort RAG lookup: embeds the message, scores it against stored
 * knowledge chunks, and returns the full system instruction to use for this
 * turn (grounded, if anything cleared the threshold, otherwise the plain
 * default). Any failure here (embedding call, DB) must never break the chat
 * turn — falls back to the ungrounded prompt and logs the error.
 */
async function buildSystemInstruction(message: string): Promise<string> {
  try {
    const { contextBlock } = await retrieveGroundingContext(message);
    if (!contextBlock) {
      return CHAT_SYSTEM_PROMPT;
    }
    return `${CHAT_SYSTEM_PROMPT}\n\n${RAG_GROUNDING_FRAMING}${contextBlock}`;
  } catch (error) {
    console.error("[ChatService] RAG retrieval failed, falling back to ungrounded prompt:", error);
    return CHAT_SYSTEM_PROMPT;
  }
}

/**
 * Streams a single assistant reply as a sequence of ChatStreamEvent values.
 * The caller (chat.controller.ts) is responsible for framing these as SSE
 * `data: ...\n\n` lines; this function knows nothing about HTTP/Express.
 *
 * This function still knows nothing about persistence — `input.history` is
 * handed to it already loaded and capped by the controller (from the
 * `messages` table, by conversationId) rather than read from the client.
 * Saving the user/assistant messages and touching the conversation row is
 * the controller's job, since it needs to accumulate the streamed chunks
 * regardless of how the stream ends (success, provider error, or abort).
 *
 * Any provider failure (missing/invalid key, network error, timeout, etc.) is
 * caught here and turned into a single AI_PROVIDER_ERROR event instead of
 * propagating — the raw SDK error is logged server-side only, never sent to
 * the client.
 */
export const ChatService = {
  async *streamChatResponse(input: ChatStreamInput): AsyncGenerator<ChatStreamEvent> {
    try {
      const systemInstruction = await buildSystemInstruction(input.message);
      for await (const chunk of streamForConversation({
        activeProvider: input.activeProvider,
        conversationId: input.conversationId,
        userId: input.userId,
        message: input.message,
        history: input.history,
        signal: input.signal,
        systemInstruction,
      })) {
        if (chunk.text) {
          yield { type: "chunk", content: chunk.text };
        }
      }
      yield { type: "done" };
    } catch (error) {
      if (input.signal?.aborted) {
        // Client disconnected / stopped generation: nothing more to send.
        return;
      }

      if (error instanceof ProviderUnavailableError) {
        console.error(
          `[ChatService] Provider "${error.provider}" unavailable after retries (model ${error.model})`
        );
        yield {
          type: "provider_unavailable",
          code: "PROVIDER_UNAVAILABLE",
          provider: error.provider,
          model: error.model,
          fallbackOptions: error.fallbackOptions,
        };
        return;
      }

      console.error("[ChatService] AI provider error:", error);
      yield {
        type: "error",
        code: "AI_PROVIDER_ERROR",
        message: "The assistant is temporarily unavailable. Please try again.",
      };
    }
  },
};

import { Request, Response, NextFunction } from "express";
import { ChatService } from "./chat.service";
import { chatRequestSchema } from "./chat.validation";
import { CHAT_MAX_HISTORY_ITEMS } from "./chat.constants";
import { AppError } from "../../utils/AppError";
import { ConversationsRepository } from "../conversations/conversations.repository";
import { MessageRole } from "../conversations/message.entity";
import { deriveTitleFromMessage } from "../conversations/conversations.service";
import { ChatMessage } from "../../services/ai/ai.types";
import { getModelForProvider, getProviderStatusSummary } from "../../services/ai/provider-manager";
import { Conversation } from "../conversations/conversation.entity";
import { sendSuccess } from "../../utils/apiResponse";

export const ChatController = {
  /**
   * Lightweight, non-live-call status check: derived purely from the shared
   * in-memory status store (no test call is made to any provider here).
   * Any logged-in user may call this; end users get only the fields they
   * need (no sanitized error message — that level of detail is admin-only).
   */
  getProviderStatus(_req: Request, res: Response, next: NextFunction): void {
    try {
      const summary = getProviderStatusSummary();
      sendSuccess(res, 200, "OK", { providers: summary });
    } catch (error) {
      next(error);
    }
  },

  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    let input;
    try {
      input = chatRequestSchema.parse(req.body);
    } catch (error) {
      // Pre-stream validation failure: normal JSON error envelope, no SSE started.
      next(error);
      return;
    }

    const userId = req.userId as string;

    // Ownership/existence check always happens BEFORE opening the SSE stream.
    let conversation: Conversation;
    try {
      if (input.conversationId) {
        const existing = await ConversationsRepository.findByIdForUser(input.conversationId, userId);
        if (!existing) {
          throw new AppError(404, "NOT_FOUND", "Conversation not found");
        }
        conversation = existing;
      } else {
        conversation = await ConversationsRepository.createConversation(userId);
      }
    } catch (error) {
      next(error);
      return;
    }
    const conversationId = conversation.id;

    // Load history (capped, oldest-first) BEFORE saving the new user message,
    // so it reflects only prior turns.
    const historyRows = await ConversationsRepository.loadRecentHistory(conversationId, CHAT_MAX_HISTORY_ITEMS);
    const history: ChatMessage[] = historyRows
      .filter((row) => row.role === MessageRole.USER || row.role === MessageRole.ASSISTANT)
      .map((row) => ({ role: row.role as "user" | "assistant", content: row.content }));

    // Persist the user's message immediately, before calling the AI provider,
    // so it survives even if the provider call subsequently fails.
    await ConversationsRepository.addMessage({
      conversationId,
      userId,
      role: MessageRole.USER,
      content: input.message,
    });

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const abortController = new AbortController();
    req.on("close", () => {
      abortController.abort();
    });

    function writeEvent(payload: Record<string, unknown>): void {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }

    // First frame, before any `chunk`, so the client learns the real
    // conversationId immediately for a brand-new chat.
    writeEvent({ type: "meta", conversationId });

    let accumulated = "";
    let providerErrored = false;

    try {
      for await (const event of ChatService.streamChatResponse({
        message: input.message,
        history,
        conversationId,
        userId,
        activeProvider: conversation.activeProvider,
        signal: abortController.signal,
      })) {
        if (event.type === "chunk") {
          accumulated += event.content;
        } else if (event.type === "error" || event.type === "provider_unavailable") {
          providerErrored = true;
        }
        writeEvent(event);
      }
    } catch (error) {
      // Defensive: ChatService already catches provider errors internally, but
      // never let anything mid-stream crash the request or hang the connection.
      console.error("[ChatController] Unexpected stream failure:", error);
      providerErrored = true;
      if (!res.writableEnded) {
        writeEvent({
          type: "error",
          code: "AI_PROVIDER_ERROR",
          message: "The assistant is temporarily unavailable. Please try again.",
        });
      }
    } finally {
      // On a provider error, leave no assistant message row (the user message
      // stays, already persisted above). On success OR a client-initiated
      // stop/disconnect, persist whatever assistant text was accumulated —
      // better a partial real answer than losing it.
      if (!providerErrored && accumulated.length > 0) {
        try {
          await ConversationsRepository.addMessage({
            conversationId,
            userId,
            role: MessageRole.ASSISTANT,
            content: accumulated,
          });
          await ConversationsRepository.setTitleIfMissing(conversationId, deriveTitleFromMessage(input.message));
          const usedModel = getModelForProvider(conversation.activeProvider);
          if (usedModel) {
            await ConversationsRepository.setActiveModelIfMissing(conversationId, usedModel);
          }
          await ConversationsRepository.touch(conversationId);
        } catch (persistError) {
          console.error("[ChatController] Failed to persist assistant message:", persistError);
        }
      }
      res.end();
    }
  },
};

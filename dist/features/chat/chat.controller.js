"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chat_service_1 = require("./chat.service");
const chat_validation_1 = require("./chat.validation");
const chat_constants_1 = require("./chat.constants");
const AppError_1 = require("../../utils/AppError");
const conversations_repository_1 = require("../conversations/conversations.repository");
const message_entity_1 = require("../conversations/message.entity");
const conversations_service_1 = require("../conversations/conversations.service");
const provider_manager_1 = require("../../services/ai/provider-manager");
const apiResponse_1 = require("../../utils/apiResponse");
exports.ChatController = {
    /**
     * Lightweight, non-live-call status check: derived purely from the shared
     * in-memory status store (no test call is made to any provider here).
     * Any logged-in user may call this; end users get only the fields they
     * need (no sanitized error message — that level of detail is admin-only).
     */
    getProviderStatus(_req, res, next) {
        try {
            const summary = (0, provider_manager_1.getProviderStatusSummary)();
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { providers: summary });
        }
        catch (error) {
            next(error);
        }
    },
    async chat(req, res, next) {
        let input;
        try {
            input = chat_validation_1.chatRequestSchema.parse(req.body);
        }
        catch (error) {
            // Pre-stream validation failure: normal JSON error envelope, no SSE started.
            next(error);
            return;
        }
        const userId = req.userId;
        // Ownership/existence check always happens BEFORE opening the SSE stream.
        let conversation;
        try {
            if (input.conversationId) {
                const existing = await conversations_repository_1.ConversationsRepository.findByIdForUser(input.conversationId, userId);
                if (!existing) {
                    throw new AppError_1.AppError(404, "NOT_FOUND", "Conversation not found");
                }
                conversation = existing;
            }
            else {
                conversation = await conversations_repository_1.ConversationsRepository.createConversation(userId);
            }
        }
        catch (error) {
            next(error);
            return;
        }
        const conversationId = conversation.id;
        // Load history (capped, oldest-first) BEFORE saving the new user message,
        // so it reflects only prior turns.
        const historyRows = await conversations_repository_1.ConversationsRepository.loadRecentHistory(conversationId, chat_constants_1.CHAT_MAX_HISTORY_ITEMS);
        const history = historyRows
            .filter((row) => row.role === message_entity_1.MessageRole.USER || row.role === message_entity_1.MessageRole.ASSISTANT)
            .map((row) => ({ role: row.role, content: row.content }));
        // Persist the user's message immediately, before calling the AI provider,
        // so it survives even if the provider call subsequently fails.
        await conversations_repository_1.ConversationsRepository.addMessage({
            conversationId,
            userId,
            role: message_entity_1.MessageRole.USER,
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
        function writeEvent(payload) {
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
        // First frame, before any `chunk`, so the client learns the real
        // conversationId immediately for a brand-new chat.
        writeEvent({ type: "meta", conversationId });
        let accumulated = "";
        let providerErrored = false;
        try {
            for await (const event of chat_service_1.ChatService.streamChatResponse({
                message: input.message,
                history,
                conversationId,
                userId,
                activeProvider: conversation.activeProvider,
                signal: abortController.signal,
            })) {
                if (event.type === "chunk") {
                    accumulated += event.content;
                }
                else if (event.type === "error" || event.type === "provider_unavailable") {
                    providerErrored = true;
                }
                writeEvent(event);
            }
        }
        catch (error) {
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
        }
        finally {
            // On a provider error, leave no assistant message row (the user message
            // stays, already persisted above). On success OR a client-initiated
            // stop/disconnect, persist whatever assistant text was accumulated —
            // better a partial real answer than losing it.
            if (!providerErrored && accumulated.length > 0) {
                try {
                    await conversations_repository_1.ConversationsRepository.addMessage({
                        conversationId,
                        userId,
                        role: message_entity_1.MessageRole.ASSISTANT,
                        content: accumulated,
                    });
                    await conversations_repository_1.ConversationsRepository.setTitleIfMissing(conversationId, (0, conversations_service_1.deriveTitleFromMessage)(input.message));
                    const usedModel = (0, provider_manager_1.getModelForProvider)(conversation.activeProvider);
                    if (usedModel) {
                        await conversations_repository_1.ConversationsRepository.setActiveModelIfMissing(conversationId, usedModel);
                    }
                    await conversations_repository_1.ConversationsRepository.touch(conversationId);
                }
                catch (persistError) {
                    console.error("[ChatController] Failed to persist assistant message:", persistError);
                }
            }
            res.end();
        }
    },
};
//# sourceMappingURL=chat.controller.js.map
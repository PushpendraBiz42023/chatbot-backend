"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRole = exports.ConversationsService = void 0;
exports.deriveTitleFromMessage = deriveTitleFromMessage;
const AppError_1 = require("../../utils/AppError");
const conversations_repository_1 = require("./conversations.repository");
const message_entity_1 = require("./message.entity");
Object.defineProperty(exports, "MessageRole", { enumerable: true, get: function () { return message_entity_1.MessageRole; } });
const provider_manager_1 = require("../../services/ai/provider-manager");
const TITLE_MAX_LENGTH = 60;
/**
 * Deterministic title from the first user message: trim, collapse internal
 * whitespace, cap at ~60 chars with an ellipsis. No AI call — out of scope.
 */
function deriveTitleFromMessage(message) {
    const collapsed = message.trim().replace(/\s+/g, " ");
    if (collapsed.length <= TITLE_MAX_LENGTH) {
        return collapsed;
    }
    return `${collapsed.slice(0, TITLE_MAX_LENGTH)}…`;
}
function toConversationDto(conversation) {
    return {
        id: conversation.id,
        title: conversation.title,
        activeProvider: conversation.activeProvider,
        activeModel: conversation.activeModel,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
    };
}
function toMessageDto(message) {
    return {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
    };
}
async function getOwnedConversationOrThrow(id, userId) {
    const conversation = await conversations_repository_1.ConversationsRepository.findByIdForUser(id, userId);
    if (!conversation) {
        // Never 403: an existing-but-not-yours conversation must look identical to a
        // nonexistent one, so we don't leak the existence of other users' data.
        throw new AppError_1.AppError(404, "NOT_FOUND", "Conversation not found");
    }
    return conversation;
}
exports.ConversationsService = {
    async list(userId) {
        const conversations = await conversations_repository_1.ConversationsRepository.listForUser(userId);
        return conversations.map(toConversationDto);
    },
    async create(userId) {
        const conversation = await conversations_repository_1.ConversationsRepository.createConversation(userId);
        return toConversationDto(conversation);
    },
    async getOne(id, userId) {
        const conversation = await getOwnedConversationOrThrow(id, userId);
        return toConversationDto(conversation);
    },
    async getMessages(id, userId) {
        await getOwnedConversationOrThrow(id, userId);
        const messages = await conversations_repository_1.ConversationsRepository.listMessagesForConversation(id);
        return messages.map(toMessageDto);
    },
    async rename(id, userId, title) {
        await getOwnedConversationOrThrow(id, userId);
        const updated = await conversations_repository_1.ConversationsRepository.renameConversation(id, title);
        return toConversationDto(updated);
    },
    async remove(id, userId) {
        await getOwnedConversationOrThrow(id, userId);
        await conversations_repository_1.ConversationsRepository.deleteConversation(id);
    },
    /**
     * Metadata-only write: switches which AI provider this conversation's next
     * chat turn will use. conversationId, messages, and history are untouched.
     * Never trusts the client's provider string beyond validating it against
     * the fixed enum AND confirming it currently has a configured API key —
     * the model always comes from server config, never the client.
     */
    async switchProvider(id, userId, provider) {
        await getOwnedConversationOrThrow(id, userId);
        if (!(0, provider_manager_1.isValidProviderName)(provider) || !(0, provider_manager_1.isProviderConfigured)(provider)) {
            throw new AppError_1.AppError(400, "VALIDATION_ERROR", "That provider is not available.");
        }
        const model = (0, provider_manager_1.getModelForProvider)(provider);
        const updated = await conversations_repository_1.ConversationsRepository.setActiveProvider(id, provider, model);
        return toConversationDto(updated);
    },
};
//# sourceMappingURL=conversations.service.js.map
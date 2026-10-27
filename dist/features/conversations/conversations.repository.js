"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsRepository = void 0;
const data_source_1 = require("../../database/data-source");
const conversation_entity_1 = require("./conversation.entity");
const message_entity_1 = require("./message.entity");
const conversationRepo = () => data_source_1.AppDataSource.getRepository(conversation_entity_1.Conversation);
const messageRepo = () => data_source_1.AppDataSource.getRepository(message_entity_1.Message);
exports.ConversationsRepository = {
    async createConversation(userId) {
        const conversation = conversationRepo().create({ userId, title: null });
        return conversationRepo().save(conversation);
    },
    /** Scoped by (id, userId) always — never look up by id alone. */
    async findByIdForUser(id, userId) {
        return conversationRepo().findOne({ where: { id, userId } });
    },
    async listForUser(userId) {
        return conversationRepo().find({
            where: { userId },
            order: { updatedAt: "DESC" },
        });
    },
    async renameConversation(id, title) {
        await conversationRepo().update({ id }, { title });
        // Re-fetch so the caller gets the fresh updatedAt set by @UpdateDateColumn.
        const updated = await conversationRepo().findOne({ where: { id } });
        if (!updated) {
            throw new Error(`Conversation ${id} disappeared during rename`);
        }
        return updated;
    },
    async setActiveProvider(id, provider, model) {
        await conversationRepo().update({ id }, { activeProvider: provider, activeModel: model });
        const updated = await conversationRepo().findOne({ where: { id } });
        if (!updated) {
            throw new Error(`Conversation ${id} disappeared during provider switch`);
        }
        return updated;
    },
    /** Sets activeModel to whatever model was actually used, only if not already set (first turn). */
    async setActiveModelIfMissing(id, model) {
        await conversationRepo()
            .createQueryBuilder()
            .update(conversation_entity_1.Conversation)
            .set({ activeModel: model })
            .where("id = :id AND active_model IS NULL", { id })
            .execute();
    },
    async touch(id) {
        // Re-saving triggers @UpdateDateColumn even when no other field changes.
        await conversationRepo().save({ id, updatedAt: new Date() });
    },
    async setTitleIfMissing(id, title) {
        await conversationRepo()
            .createQueryBuilder()
            .update(conversation_entity_1.Conversation)
            .set({ title })
            .where("id = :id AND title IS NULL", { id })
            .execute();
    },
    async deleteConversation(id) {
        await conversationRepo().delete({ id });
    },
    // --- Messages ---
    async addMessage(data) {
        const message = messageRepo().create(data);
        return messageRepo().save(message);
    },
    async listMessagesForConversation(conversationId) {
        return messageRepo().find({
            where: { conversationId },
            order: { createdAt: "ASC" },
        });
    },
    /** Most recent `limit` messages for a conversation, ordered oldest-first (for prompt history). */
    async loadRecentHistory(conversationId, limit) {
        const recent = await messageRepo().find({
            where: { conversationId },
            order: { createdAt: "DESC" },
            take: limit,
        });
        return recent.reverse();
    },
};
//# sourceMappingURL=conversations.repository.js.map
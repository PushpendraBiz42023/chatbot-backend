"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const data_source_1 = require("../../database/data-source");
const user_entity_1 = require("../auth/user.entity");
const conversation_entity_1 = require("../conversations/conversation.entity");
const message_entity_1 = require("../conversations/message.entity");
const knowledge_entry_entity_1 = require("../knowledge/knowledge-entry.entity");
const knowledge_document_entity_1 = require("../documents/knowledge-document.entity");
const userRepo = () => data_source_1.AppDataSource.getRepository(user_entity_1.User);
const conversationRepo = () => data_source_1.AppDataSource.getRepository(conversation_entity_1.Conversation);
const messageRepo = () => data_source_1.AppDataSource.getRepository(message_entity_1.Message);
const knowledgeRepo = () => data_source_1.AppDataSource.getRepository(knowledge_entry_entity_1.KnowledgeEntry);
const documentRepo = () => data_source_1.AppDataSource.getRepository(knowledge_document_entity_1.KnowledgeDocument);
exports.AdminRepository = {
    async countUsers() {
        return userRepo().count();
    },
    async countConversations() {
        return conversationRepo().count();
    },
    async countKnowledgeEntries() {
        return knowledgeRepo().count();
    },
    async countDocuments() {
        return documentRepo().count();
    },
    /**
     * All users with their conversation count, computed via a single grouped
     * LEFT JOIN (not one COUNT query per user).
     */
    async listUsersWithConversationCount() {
        const rows = await userRepo()
            .createQueryBuilder("user")
            .leftJoin(conversation_entity_1.Conversation, "conversation", "conversation.user_id = user.id")
            .select("user.id", "id")
            .addSelect("user.name", "name")
            .addSelect("user.email", "email")
            .addSelect("user.role", "role")
            .addSelect("user.isVerified", "isVerified")
            .addSelect("user.createdAt", "createdAt")
            .addSelect("COUNT(conversation.id)", "conversationCount")
            .groupBy("user.id")
            .orderBy("user.createdAt", "DESC")
            .getRawMany();
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            isVerified: Boolean(row.isVerified),
            createdAt: row.createdAt,
            conversationCount: Number(row.conversationCount),
        }));
    },
    async findUserById(userId) {
        return userRepo().findOne({ where: { id: userId } });
    },
    /**
     * A given user's conversations with per-conversation message counts, via a
     * single grouped LEFT JOIN scoped by `userId` (never a global query).
     */
    async listConversationsForUserWithMessageCount(userId) {
        const rows = await conversationRepo()
            .createQueryBuilder("conversation")
            .leftJoin(message_entity_1.Message, "message", "message.conversation_id = conversation.id")
            .select("conversation.id", "id")
            .addSelect("conversation.title", "title")
            .addSelect("conversation.createdAt", "createdAt")
            .addSelect("conversation.updatedAt", "updatedAt")
            .addSelect("COUNT(message.id)", "messageCount")
            .where("conversation.user_id = :userId", { userId })
            .groupBy("conversation.id")
            .orderBy("conversation.updatedAt", "DESC")
            .getRawMany();
        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            messageCount: Number(row.messageCount),
        }));
    },
    /**
     * Scoped by (id, userId) always — mirrors ConversationsRepository.findByIdForUser
     * so a conversationId alone can never resolve to a different user's data.
     */
    async findConversationForUser(conversationId, userId) {
        return conversationRepo().findOne({ where: { id: conversationId, userId } });
    },
    async listMessagesForConversation(conversationId) {
        return messageRepo().find({
            where: { conversationId },
            order: { createdAt: "ASC" },
        });
    },
};
//# sourceMappingURL=admin.repository.js.map
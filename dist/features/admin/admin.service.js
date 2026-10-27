"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const AppError_1 = require("../../utils/AppError");
const admin_repository_1 = require("./admin.repository");
const ai_provider_usage_repository_1 = require("./ai-provider-usage.repository");
const provider_manager_1 = require("../../services/ai/provider-manager");
const provider_status_store_1 = require("../../services/ai/provider-status.store");
function toMessageDto(message) {
    return {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
    };
}
exports.AdminService = {
    async getStats() {
        const [totalUsers, totalConversations, totalKnowledgeEntries, totalDocuments] = await Promise.all([
            admin_repository_1.AdminRepository.countUsers(),
            admin_repository_1.AdminRepository.countConversations(),
            admin_repository_1.AdminRepository.countKnowledgeEntries(),
            admin_repository_1.AdminRepository.countDocuments(),
        ]);
        return { totalUsers, totalConversations, totalKnowledgeEntries, totalDocuments };
    },
    async listUsers() {
        const rows = await admin_repository_1.AdminRepository.listUsersWithConversationCount();
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            isVerified: row.isVerified,
            createdAt: row.createdAt,
            conversationCount: row.conversationCount,
        }));
    },
    async listUserConversations(userId) {
        const user = await admin_repository_1.AdminRepository.findUserById(userId);
        if (!user) {
            throw new AppError_1.AppError(404, "NOT_FOUND", "User not found");
        }
        const rows = await admin_repository_1.AdminRepository.listConversationsForUserWithMessageCount(userId);
        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            messageCount: row.messageCount,
        }));
    },
    async getUserConversationMessages(adminUserId, userId, conversationId) {
        // Scoped by (conversationId, userId) always — a conversationId alone must
        // never be enough to fetch a different user's conversation.
        const conversation = await admin_repository_1.AdminRepository.findConversationForUser(conversationId, userId);
        if (!conversation) {
            throw new AppError_1.AppError(404, "NOT_FOUND", "Conversation not found");
        }
        const messages = await admin_repository_1.AdminRepository.listMessagesForConversation(conversationId);
        // Minimal audit breadcrumb: an admin is viewing another user's conversation content.
        // eslint-disable-next-line no-console
        console.log(`[Admin] ${adminUserId} viewed conversation ${conversationId} of user ${userId}`);
        return messages.map(toMessageDto);
    },
    async getProviderStatus() {
        const configuredSet = new Set((0, provider_manager_1.getConfiguredProviders)());
        return provider_manager_1.PROVIDER_PRIORITY.map((provider) => {
            const configured = configuredSet.has(provider);
            if (!configured) {
                return {
                    provider,
                    model: null,
                    configured: false,
                    status: "unavailable",
                    lastError: null,
                    lastSuccessAt: null,
                    lastFailureAt: null,
                };
            }
            const entry = provider_status_store_1.providerStatusStore.get(provider);
            return {
                provider,
                model: (0, provider_manager_1.getModelForProvider)(provider),
                configured: true,
                status: entry.status,
                lastError: entry.lastError?.message ?? null,
                lastSuccessAt: entry.lastSuccessAt,
                lastFailureAt: entry.lastFailureAt,
            };
        });
    },
    async getProviderUsage() {
        const rows = await ai_provider_usage_repository_1.AiProviderUsageRepository.getAggregatedUsage();
        return rows;
    },
};
//# sourceMappingURL=admin.service.js.map
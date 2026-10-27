import { AppError } from "../../utils/AppError";
import { AdminRepository } from "./admin.repository";
import { AiProviderUsageRepository } from "./ai-provider-usage.repository";
import { Message } from "../conversations/message.entity";
import { PROVIDER_PRIORITY, getModelForProvider, getConfiguredProviders } from "../../services/ai/provider-manager";
import { providerStatusStore } from "../../services/ai/provider-status.store";
import {
  AdminConversationListItemDto,
  AdminMessageDto,
  AdminProviderStatusDto,
  AdminProviderUsageDto,
  AdminStatsDto,
  AdminUserListItemDto,
} from "./admin.types";

function toMessageDto(message: Message): AdminMessageDto {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  };
}

export const AdminService = {
  async getStats(): Promise<AdminStatsDto> {
    const [totalUsers, totalConversations, totalKnowledgeEntries, totalDocuments] = await Promise.all([
      AdminRepository.countUsers(),
      AdminRepository.countConversations(),
      AdminRepository.countKnowledgeEntries(),
      AdminRepository.countDocuments(),
    ]);
    return { totalUsers, totalConversations, totalKnowledgeEntries, totalDocuments };
  },

  async listUsers(): Promise<AdminUserListItemDto[]> {
    const rows = await AdminRepository.listUsersWithConversationCount();
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

  async listUserConversations(userId: string): Promise<AdminConversationListItemDto[]> {
    const user = await AdminRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }
    const rows = await AdminRepository.listConversationsForUserWithMessageCount(userId);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      messageCount: row.messageCount,
    }));
  },

  async getUserConversationMessages(
    adminUserId: string,
    userId: string,
    conversationId: string
  ): Promise<AdminMessageDto[]> {
    // Scoped by (conversationId, userId) always — a conversationId alone must
    // never be enough to fetch a different user's conversation.
    const conversation = await AdminRepository.findConversationForUser(conversationId, userId);
    if (!conversation) {
      throw new AppError(404, "NOT_FOUND", "Conversation not found");
    }

    const messages = await AdminRepository.listMessagesForConversation(conversationId);

    // Minimal audit breadcrumb: an admin is viewing another user's conversation content.
    // eslint-disable-next-line no-console
    console.log(`[Admin] ${adminUserId} viewed conversation ${conversationId} of user ${userId}`);

    return messages.map(toMessageDto);
  },

  async getProviderStatus(): Promise<AdminProviderStatusDto[]> {
    const configuredSet = new Set(getConfiguredProviders());
    return PROVIDER_PRIORITY.map((provider) => {
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
      const entry = providerStatusStore.get(provider);
      return {
        provider,
        model: getModelForProvider(provider),
        configured: true,
        status: entry.status,
        lastError: entry.lastError?.message ?? null,
        lastSuccessAt: entry.lastSuccessAt,
        lastFailureAt: entry.lastFailureAt,
      };
    });
  },

  async getProviderUsage(): Promise<AdminProviderUsageDto[]> {
    const rows = await AiProviderUsageRepository.getAggregatedUsage();
    return rows;
  },
};

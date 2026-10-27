import { UserRole } from "../auth/user.entity";

export interface AdminStatsDto {
  totalUsers: number;
  totalConversations: number;
  totalKnowledgeEntries: number;
  totalDocuments: number;
}

export interface AdminUserListItemDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  conversationCount: number;
}

export interface AdminConversationListItemDto {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface AdminMessageDto {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

export interface AdminProviderStatusDto {
  provider: string;
  model: string | null;
  configured: boolean;
  status: string;
  lastError: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
}

export interface AdminProviderUsageDto {
  provider: string;
  model: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitErrors: number;
  quotaErrors: number;
  timeouts: number;
  serverErrors: number;
  otherErrors: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
}

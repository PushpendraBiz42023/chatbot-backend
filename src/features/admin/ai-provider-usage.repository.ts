import { AppDataSource } from "../../database/data-source";
import { AiProviderUsage, AiProviderUsageStatus } from "./ai-provider-usage.entity";

const usageRepo = () => AppDataSource.getRepository(AiProviderUsage);

export interface RecordUsageInput {
  provider: string;
  model: string;
  conversationId: string | null;
  userId: string | null;
  status: AiProviderUsageStatus;
  errorType: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
}

export interface UsageAggregateRow {
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

export const AiProviderUsageRepository = {
  /** Fire-and-forget by callers — a usage-logging failure must never break a chat turn. */
  async record(input: RecordUsageInput): Promise<void> {
    const row = usageRepo().create(input);
    await usageRepo().save(row);
  },

  async getAggregatedUsage(): Promise<UsageAggregateRow[]> {
    const rows = await usageRepo()
      .createQueryBuilder("u")
      .select("u.provider", "provider")
      .addSelect("u.model", "model")
      .addSelect("COUNT(*)", "totalRequests")
      .addSelect("SUM(CASE WHEN u.status = :success THEN 1 ELSE 0 END)", "successfulRequests")
      .addSelect("SUM(CASE WHEN u.status = :error THEN 1 ELSE 0 END)", "failedRequests")
      .addSelect("SUM(CASE WHEN u.errorType = 'temporarily_rate_limited' THEN 1 ELSE 0 END)", "rateLimitErrors")
      .addSelect("SUM(CASE WHEN u.errorType = 'quota_exhausted' THEN 1 ELSE 0 END)", "quotaErrors")
      .addSelect("SUM(CASE WHEN u.errorType = 'timeout' THEN 1 ELSE 0 END)", "timeouts")
      .addSelect("SUM(CASE WHEN u.errorType = 'server_error' THEN 1 ELSE 0 END)", "serverErrors")
      .addSelect(
        "SUM(CASE WHEN u.status = :error AND (u.errorType IS NULL OR u.errorType NOT IN ('temporarily_rate_limited','quota_exhausted','timeout','server_error')) THEN 1 ELSE 0 END)",
        "otherErrors"
      )
      .addSelect("COALESCE(SUM(u.inputTokens), 0)", "totalInputTokens")
      .addSelect("COALESCE(SUM(u.outputTokens), 0)", "totalOutputTokens")
      .addSelect("MAX(CASE WHEN u.status = :success THEN u.createdAt END)", "lastSuccessAt")
      .addSelect("MAX(CASE WHEN u.status = :error THEN u.createdAt END)", "lastFailureAt")
      .setParameters({ success: AiProviderUsageStatus.SUCCESS, error: AiProviderUsageStatus.ERROR })
      .groupBy("u.provider")
      .addGroupBy("u.model")
      .getRawMany<{
        provider: string;
        model: string;
        totalRequests: string;
        successfulRequests: string;
        failedRequests: string;
        rateLimitErrors: string;
        quotaErrors: string;
        timeouts: string;
        serverErrors: string;
        otherErrors: string;
        totalInputTokens: string;
        totalOutputTokens: string;
        lastSuccessAt: Date | null;
        lastFailureAt: Date | null;
      }>();

    return rows.map((row) => ({
      provider: row.provider,
      model: row.model,
      totalRequests: Number(row.totalRequests),
      successfulRequests: Number(row.successfulRequests),
      failedRequests: Number(row.failedRequests),
      rateLimitErrors: Number(row.rateLimitErrors),
      quotaErrors: Number(row.quotaErrors),
      timeouts: Number(row.timeouts),
      serverErrors: Number(row.serverErrors),
      otherErrors: Number(row.otherErrors),
      totalInputTokens: Number(row.totalInputTokens),
      totalOutputTokens: Number(row.totalOutputTokens),
      lastSuccessAt: row.lastSuccessAt,
      lastFailureAt: row.lastFailureAt,
    }));
  },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiProviderUsageRepository = void 0;
const data_source_1 = require("../../database/data-source");
const ai_provider_usage_entity_1 = require("./ai-provider-usage.entity");
const usageRepo = () => data_source_1.AppDataSource.getRepository(ai_provider_usage_entity_1.AiProviderUsage);
exports.AiProviderUsageRepository = {
    /** Fire-and-forget by callers — a usage-logging failure must never break a chat turn. */
    async record(input) {
        const row = usageRepo().create(input);
        await usageRepo().save(row);
    },
    async getAggregatedUsage() {
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
            .addSelect("SUM(CASE WHEN u.status = :error AND (u.errorType IS NULL OR u.errorType NOT IN ('temporarily_rate_limited','quota_exhausted','timeout','server_error')) THEN 1 ELSE 0 END)", "otherErrors")
            .addSelect("COALESCE(SUM(u.inputTokens), 0)", "totalInputTokens")
            .addSelect("COALESCE(SUM(u.outputTokens), 0)", "totalOutputTokens")
            .addSelect("MAX(CASE WHEN u.status = :success THEN u.createdAt END)", "lastSuccessAt")
            .addSelect("MAX(CASE WHEN u.status = :error THEN u.createdAt END)", "lastFailureAt")
            .setParameters({ success: ai_provider_usage_entity_1.AiProviderUsageStatus.SUCCESS, error: ai_provider_usage_entity_1.AiProviderUsageStatus.ERROR })
            .groupBy("u.provider")
            .addGroupBy("u.model")
            .getRawMany();
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
//# sourceMappingURL=ai-provider-usage.repository.js.map
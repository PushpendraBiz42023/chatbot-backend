"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDER_PRIORITY = void 0;
exports.isValidProviderName = isValidProviderName;
exports.isProviderConfigured = isProviderConfigured;
exports.getConfiguredProviders = getConfiguredProviders;
exports.getModelForProvider = getModelForProvider;
exports.streamForConversation = streamForConversation;
exports.getProviderStatusSummary = getProviderStatusSummary;
const env_1 = require("../../config/env");
const ai_provider_usage_repository_1 = require("../../features/admin/ai-provider-usage.repository");
const ai_provider_usage_entity_1 = require("../../features/admin/ai-provider-usage.entity");
const gemini_provider_1 = require("./gemini.provider");
const groq_provider_1 = require("./groq.provider");
const mistral_provider_1 = require("./mistral.provider");
const openrouter_provider_1 = require("./openrouter.provider");
const provider_error_1 = require("./provider-error");
const provider_status_store_1 = require("./provider-status.store");
const provider_unavailable_error_1 = require("./provider-unavailable.error");
/** Fixed, hardcoded priority — not configurable via request. */
exports.PROVIDER_PRIORITY = ["gemini", "groq", "mistral", "openrouter"];
// Registry built once at startup: a provider is registered only if its API
// key env var is non-empty. Gemini's key is required elsewhere (env.ts), so
// it is always present.
const registry = new Map();
registry.set("gemini", { adapter: (0, gemini_provider_1.createGeminiProvider)(), model: env_1.env.gemini.model });
if (env_1.env.groq.apiKey) {
    registry.set("groq", { adapter: (0, groq_provider_1.createGroqProvider)(), model: env_1.env.groq.model });
}
if (env_1.env.mistral.apiKey) {
    registry.set("mistral", { adapter: (0, mistral_provider_1.createMistralProvider)(), model: env_1.env.mistral.model });
}
if (env_1.env.openrouter.apiKey) {
    registry.set("openrouter", { adapter: (0, openrouter_provider_1.createOpenRouterProvider)(), model: env_1.env.openrouter.model });
}
function isValidProviderName(value) {
    return exports.PROVIDER_PRIORITY.includes(value);
}
function isProviderConfigured(provider) {
    return isValidProviderName(provider) && registry.has(provider);
}
function getConfiguredProviders() {
    return exports.PROVIDER_PRIORITY.filter((name) => registry.has(name));
}
function getModelForProvider(provider) {
    if (!isValidProviderName(provider))
        return null;
    return registry.get(provider)?.model ?? null;
}
/** Default cooldown applied when a normalized error carries no explicit Retry-After. */
const DEFAULT_COOLDOWNS_MS = {
    quota_exhausted: 60 * 60 * 1000, // 1 hour — hard exhaustion, don't hammer it
    authentication_error: 60 * 60 * 1000,
    configuration_error: 60 * 60 * 1000,
    temporarily_rate_limited: 30 * 1000,
    network_error: 15 * 1000,
    server_error: 15 * 1000,
};
function computeFallbackOptions(activeProvider) {
    const idx = exports.PROVIDER_PRIORITY.indexOf(activeProvider);
    return exports.PROVIDER_PRIORITY.slice(idx + 1)
        .filter((name) => registry.has(name))
        .map((name) => ({ provider: name, available: provider_status_store_1.providerStatusStore.isAvailable(name) }));
}
/**
 * Runs the active provider's adapter through the retry policy, recording one
 * usage row per real attempt (success or failure, including retries) and
 * updating the shared status store. On a final non-retryable/exhausted
 * failure, throws `ProviderUnavailableError` — it never silently tries the
 * next provider in priority order (switching is an explicit user action).
 */
async function* streamForConversation(input) {
    const requested = isValidProviderName(input.activeProvider) && registry.has(input.activeProvider)
        ? input.activeProvider
        : "gemini"; // defensive fallback; the switch endpoint already validates configuration
    const registered = registry.get(requested);
    if (!registered) {
        // Should be unreachable (gemini is always registered), but fail closed.
        throw new provider_unavailable_error_1.ProviderUnavailableError(requested, "unknown", []);
    }
    const { adapter, model } = registered;
    const maxRetries = env_1.env.ai.maxRetries;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const startedAt = Date.now();
        let yieldedAny = false;
        try {
            for await (const chunk of adapter.streamResponse({
                message: input.message,
                history: input.history,
                systemInstruction: input.systemInstruction,
                signal: input.signal,
            })) {
                if (chunk.text) {
                    yieldedAny = true;
                    yield { text: chunk.text };
                }
                if (chunk.usage) {
                    void ai_provider_usage_repository_1.AiProviderUsageRepository.record({
                        provider: requested,
                        model,
                        conversationId: input.conversationId,
                        userId: input.userId,
                        status: ai_provider_usage_entity_1.AiProviderUsageStatus.SUCCESS,
                        errorType: null,
                        inputTokens: chunk.usage.inputTokens,
                        outputTokens: chunk.usage.outputTokens,
                        totalTokens: chunk.usage.totalTokens,
                        latencyMs: Date.now() - startedAt,
                    }).catch((err) => console.error("[ProviderManager] Failed to record usage:", err));
                }
            }
            provider_status_store_1.providerStatusStore.recordSuccess(requested);
            return;
        }
        catch (rawError) {
            const normalized = (0, provider_error_1.normalizeProviderError)(requested, model, rawError);
            const cooldownMs = normalized.retryAfterMs ?? DEFAULT_COOLDOWNS_MS[normalized.type] ?? null;
            provider_status_store_1.providerStatusStore.recordFailure(requested, normalized, cooldownMs);
            void ai_provider_usage_repository_1.AiProviderUsageRepository.record({
                provider: requested,
                model,
                conversationId: input.conversationId,
                userId: input.userId,
                status: ai_provider_usage_entity_1.AiProviderUsageStatus.ERROR,
                errorType: normalized.type,
                inputTokens: null,
                outputTokens: null,
                totalTokens: null,
                latencyMs: Date.now() - startedAt,
            }).catch((err) => console.error("[ProviderManager] Failed to record usage:", err));
            if (yieldedAny) {
                // Partial output was already streamed to the client; retrying (which
                // would re-send the whole answer from scratch) or presenting the
                // switch-UI on top of a half-sent answer would be confusing. Surface
                // this as the generic, last-resort provider error instead.
                throw rawError;
            }
            const isLastAttempt = attempt === maxRetries;
            if (!normalized.retryable || isLastAttempt) {
                throw new provider_unavailable_error_1.ProviderUnavailableError(requested, model, computeFallbackOptions(requested));
            }
            const delayMs = normalized.retryAfterMs ?? env_1.env.ai.retryBaseDelayMs * 2 ** attempt;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}
function getProviderStatusSummary() {
    return exports.PROVIDER_PRIORITY.map((provider) => {
        const configured = registry.has(provider);
        return {
            provider,
            configured,
            status: configured ? provider_status_store_1.providerStatusStore.get(provider).status : "unavailable",
        };
    });
}
//# sourceMappingURL=provider-manager.js.map
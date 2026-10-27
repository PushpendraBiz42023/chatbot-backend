import { env } from "../../config/env";
import { AiProviderUsageRepository } from "../../features/admin/ai-provider-usage.repository";
import { AiProviderUsageStatus } from "../../features/admin/ai-provider-usage.entity";
import { AIProvider, AIStreamChunk, ChatMessage } from "./ai.types";
import { createGeminiProvider } from "./gemini.provider";
import { createGroqProvider } from "./groq.provider";
import { createMistralProvider } from "./mistral.provider";
import { createOpenRouterProvider } from "./openrouter.provider";
import { normalizeProviderError } from "./provider-error";
import { providerStatusStore, ProviderStatus } from "./provider-status.store";
import { FallbackOption, ProviderUnavailableError } from "./provider-unavailable.error";

/** Fixed, hardcoded priority — not configurable via request. */
export const PROVIDER_PRIORITY = ["gemini", "groq", "mistral", "openrouter"] as const;
export type ProviderName = (typeof PROVIDER_PRIORITY)[number];

interface RegisteredProvider {
  adapter: AIProvider;
  model: string;
}

// Registry built once at startup: a provider is registered only if its API
// key env var is non-empty. Gemini's key is required elsewhere (env.ts), so
// it is always present.
const registry = new Map<ProviderName, RegisteredProvider>();
registry.set("gemini", { adapter: createGeminiProvider(), model: env.gemini.model });
if (env.groq.apiKey) {
  registry.set("groq", { adapter: createGroqProvider(), model: env.groq.model });
}
if (env.mistral.apiKey) {
  registry.set("mistral", { adapter: createMistralProvider(), model: env.mistral.model });
}
if (env.openrouter.apiKey) {
  registry.set("openrouter", { adapter: createOpenRouterProvider(), model: env.openrouter.model });
}

export function isValidProviderName(value: string): value is ProviderName {
  return (PROVIDER_PRIORITY as readonly string[]).includes(value);
}

export function isProviderConfigured(provider: string): boolean {
  return isValidProviderName(provider) && registry.has(provider);
}

export function getConfiguredProviders(): ProviderName[] {
  return PROVIDER_PRIORITY.filter((name) => registry.has(name));
}

export function getModelForProvider(provider: string): string | null {
  if (!isValidProviderName(provider)) return null;
  return registry.get(provider)?.model ?? null;
}

/** Default cooldown applied when a normalized error carries no explicit Retry-After. */
const DEFAULT_COOLDOWNS_MS: Partial<Record<ReturnType<typeof normalizeProviderError>["type"], number>> = {
  quota_exhausted: 60 * 60 * 1000, // 1 hour — hard exhaustion, don't hammer it
  authentication_error: 60 * 60 * 1000,
  configuration_error: 60 * 60 * 1000,
  temporarily_rate_limited: 30 * 1000,
  network_error: 15 * 1000,
  server_error: 15 * 1000,
};

function computeFallbackOptions(activeProvider: ProviderName): FallbackOption[] {
  const idx = PROVIDER_PRIORITY.indexOf(activeProvider);
  return PROVIDER_PRIORITY.slice(idx + 1)
    .filter((name) => registry.has(name))
    .map((name) => ({ provider: name, available: providerStatusStore.isAvailable(name) }));
}

export interface StreamForConversationInput {
  activeProvider: string;
  conversationId: string | null;
  userId: string | null;
  message: string;
  history: ChatMessage[];
  systemInstruction?: string;
  signal?: AbortSignal;
}

/**
 * Runs the active provider's adapter through the retry policy, recording one
 * usage row per real attempt (success or failure, including retries) and
 * updating the shared status store. On a final non-retryable/exhausted
 * failure, throws `ProviderUnavailableError` — it never silently tries the
 * next provider in priority order (switching is an explicit user action).
 */
export async function* streamForConversation(input: StreamForConversationInput): AsyncGenerator<AIStreamChunk> {
  const requested = isValidProviderName(input.activeProvider) && registry.has(input.activeProvider)
    ? input.activeProvider
    : "gemini"; // defensive fallback; the switch endpoint already validates configuration

  const registered = registry.get(requested);
  if (!registered) {
    // Should be unreachable (gemini is always registered), but fail closed.
    throw new ProviderUnavailableError(requested, "unknown", []);
  }
  const { adapter, model } = registered;

  const maxRetries = env.ai.maxRetries;

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
          void AiProviderUsageRepository.record({
            provider: requested,
            model,
            conversationId: input.conversationId,
            userId: input.userId,
            status: AiProviderUsageStatus.SUCCESS,
            errorType: null,
            inputTokens: chunk.usage.inputTokens,
            outputTokens: chunk.usage.outputTokens,
            totalTokens: chunk.usage.totalTokens,
            latencyMs: Date.now() - startedAt,
          }).catch((err) => console.error("[ProviderManager] Failed to record usage:", err));
        }
      }

      providerStatusStore.recordSuccess(requested);
      return;
    } catch (rawError) {
      const normalized = normalizeProviderError(requested, model, rawError);
      const cooldownMs = normalized.retryAfterMs ?? DEFAULT_COOLDOWNS_MS[normalized.type] ?? null;
      providerStatusStore.recordFailure(requested, normalized, cooldownMs);

      void AiProviderUsageRepository.record({
        provider: requested,
        model,
        conversationId: input.conversationId,
        userId: input.userId,
        status: AiProviderUsageStatus.ERROR,
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
        throw new ProviderUnavailableError(requested, model, computeFallbackOptions(requested));
      }

      const delayMs = normalized.retryAfterMs ?? env.ai.retryBaseDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export interface ProviderStatusSummary {
  provider: ProviderName;
  configured: boolean;
  status: ProviderStatus;
}

export function getProviderStatusSummary(): ProviderStatusSummary[] {
  return PROVIDER_PRIORITY.map((provider) => {
    const configured = registry.has(provider);
    return {
      provider,
      configured,
      status: configured ? providerStatusStore.get(provider).status : "unavailable",
    };
  });
}

import { env } from "../../config/env";
import { NormalizedProviderError, normalizeProviderError } from "./provider-error";

export interface RetryOptions {
  provider: string;
  model: string;
  maxRetries?: number;
  baseDelayMs?: number;
  /** Called after every attempt (success or failure), before any retry sleep. */
  onAttempt?: (error: NormalizedProviderError | null) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jittered(delayMs: number): number {
  const jitterFactor = 0.8 + Math.random() * 0.4; // +/-20%
  return Math.round(delayMs * jitterFactor);
}

/**
 * Calls `fn()`, and on a retryable normalized error, retries with backoff
 * (Retry-After if present, else exponential backoff with jitter) up to
 * `maxRetries` attempts total. Non-retryable errors throw immediately. The
 * final thrown error is always the `NormalizedProviderError`-carrying
 * rejection from the last attempt, wrapped so the caller (ProviderManager)
 * can inspect it directly.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const maxRetries = options.maxRetries ?? env.ai.maxRetries;
  const baseDelayMs = options.baseDelayMs ?? env.ai.retryBaseDelayMs;

  let lastNormalized: NormalizedProviderError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      options.onAttempt?.(null);
      return result;
    } catch (rawError) {
      const normalized = normalizeProviderError(options.provider, options.model, rawError);
      lastNormalized = normalized;
      options.onAttempt?.(normalized);

      const isLastAttempt = attempt === maxRetries;
      if (!normalized.retryable || isLastAttempt) {
        throw new RetryExhaustedError(normalized);
      }

      const delayMs = normalized.retryAfterMs ?? jittered(baseDelayMs * 2 ** attempt);
      await sleep(delayMs);
    }
  }

  // Unreachable, but keeps TypeScript happy about the return type.
  throw new RetryExhaustedError(
    lastNormalized ?? normalizeProviderError(options.provider, options.model, new Error("Retry loop exited unexpectedly"))
  );
}

/** Thrown once retries are exhausted (or the error was non-retryable to begin with). */
export class RetryExhaustedError extends Error {
  constructor(public readonly normalized: NormalizedProviderError) {
    super(normalized.message);
    this.name = "RetryExhaustedError";
    Object.setPrototypeOf(this, RetryExhaustedError.prototype);
  }
}

/** Combines the caller's own abort signal with a request timeout guard, whichever fires first. */
export function withTimeoutSignal(signal: AbortSignal | undefined, timeoutMs?: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs ?? env.ai.requestTimeoutMs);
  if (!signal) {
    return timeout;
  }
  return AbortSignal.any([signal, timeout]);
}

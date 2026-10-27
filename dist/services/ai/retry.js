"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryExhaustedError = void 0;
exports.withRetry = withRetry;
exports.withTimeoutSignal = withTimeoutSignal;
const env_1 = require("../../config/env");
const provider_error_1 = require("./provider-error");
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function jittered(delayMs) {
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
async function withRetry(fn, options) {
    const maxRetries = options.maxRetries ?? env_1.env.ai.maxRetries;
    const baseDelayMs = options.baseDelayMs ?? env_1.env.ai.retryBaseDelayMs;
    let lastNormalized = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await fn();
            options.onAttempt?.(null);
            return result;
        }
        catch (rawError) {
            const normalized = (0, provider_error_1.normalizeProviderError)(options.provider, options.model, rawError);
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
    throw new RetryExhaustedError(lastNormalized ?? (0, provider_error_1.normalizeProviderError)(options.provider, options.model, new Error("Retry loop exited unexpectedly")));
}
/** Thrown once retries are exhausted (or the error was non-retryable to begin with). */
class RetryExhaustedError extends Error {
    constructor(normalized) {
        super(normalized.message);
        this.normalized = normalized;
        this.name = "RetryExhaustedError";
        Object.setPrototypeOf(this, RetryExhaustedError.prototype);
    }
}
exports.RetryExhaustedError = RetryExhaustedError;
/** Combines the caller's own abort signal with a request timeout guard, whichever fires first. */
function withTimeoutSignal(signal, timeoutMs) {
    const timeout = AbortSignal.timeout(timeoutMs ?? env_1.env.ai.requestTimeoutMs);
    if (!signal) {
        return timeout;
    }
    return AbortSignal.any([signal, timeout]);
}
//# sourceMappingURL=retry.js.map
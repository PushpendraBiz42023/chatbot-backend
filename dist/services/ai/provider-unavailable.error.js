"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderUnavailableError = void 0;
/**
 * Thrown by ProviderManager when the active provider's retry budget is
 * exhausted (or the failure was non-retryable to begin with). Caught
 * specifically by chat.controller.ts to emit the `provider_unavailable` SSE
 * event instead of the generic `AI_PROVIDER_ERROR` fallback.
 */
class ProviderUnavailableError extends Error {
    constructor(provider, model, fallbackOptions) {
        super(`Provider "${provider}" is currently unavailable`);
        this.provider = provider;
        this.model = model;
        this.fallbackOptions = fallbackOptions;
        this.name = "ProviderUnavailableError";
        Object.setPrototypeOf(this, ProviderUnavailableError.prototype);
    }
}
exports.ProviderUnavailableError = ProviderUnavailableError;
//# sourceMappingURL=provider-unavailable.error.js.map
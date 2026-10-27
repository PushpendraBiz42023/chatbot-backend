export interface FallbackOption {
  provider: string;
  available: boolean;
}

/**
 * Thrown by ProviderManager when the active provider's retry budget is
 * exhausted (or the failure was non-retryable to begin with). Caught
 * specifically by chat.controller.ts to emit the `provider_unavailable` SSE
 * event instead of the generic `AI_PROVIDER_ERROR` fallback.
 */
export class ProviderUnavailableError extends Error {
  constructor(
    public readonly provider: string,
    public readonly model: string,
    public readonly fallbackOptions: FallbackOption[]
  ) {
    super(`Provider "${provider}" is currently unavailable`);
    this.name = "ProviderUnavailableError";
    Object.setPrototypeOf(this, ProviderUnavailableError.prototype);
  }
}

export type ProviderErrorType =
  | "temporarily_rate_limited"
  | "quota_exhausted"
  | "authentication_error"
  | "configuration_error"
  | "permission_error"
  | "timeout"
  | "network_error"
  | "server_error"
  | "malformed_response"
  | "unknown_error";

export interface NormalizedProviderError {
  provider: string;
  model: string;
  type: ProviderErrorType;
  statusCode: number | null;
  retryable: boolean;
  quotaExhausted: boolean;
  retryAfterMs: number | null;
  message: string;
  timestamp: string;
}

/**
 * Raised by an adapter (or by the `fetch`-based SSE reader) so
 * `normalizeProviderError` has structured data to classify instead of a raw
 * `unknown` thrown value. Adapters that only ever throw this class make
 * classification deterministic; a plain Error/AbortError/network exception is
 * still handled defensively below.
 */
export class ProviderCallError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | null,
    public readonly retryAfterHeader: string | null,
    public readonly rawBody: string | null
  ) {
    super(message);
    this.name = "ProviderCallError";
    Object.setPrototypeOf(this, ProviderCallError.prototype);
  }
}

const QUOTA_HINTS = ["insufficient_quota", "quota", "billing", "exceeded your current quota"];

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  const seconds = Number(trimmed);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }
  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    const deltaMs = dateMs - Date.now();
    return deltaMs > 0 ? deltaMs : 0;
  }
  return null;
}

function bodyLooksQuotaExhausted(rawBody: string | null): boolean {
  if (!rawBody) return false;
  const lower = rawBody.toLowerCase();
  return QUOTA_HINTS.some((hint) => lower.includes(hint));
}

function sanitizeMessage(type: ProviderErrorType, statusCode: number | null, provider: string): string {
  const statusPart = statusCode !== null ? ` (HTTP ${statusCode})` : "";
  return `${provider} request failed: ${type}${statusPart}`;
}

/**
 * Classifies a raw error thrown by a provider adapter into a
 * `NormalizedProviderError`. Never includes the raw error object, a stack
 * trace, or any part of an API key in the resulting `message` — only a short,
 * sanitized, human-ish description safe to log and safe to surface to an
 * admin (never to an end user).
 */
export function normalizeProviderError(provider: string, model: string, rawError: unknown): NormalizedProviderError {
  const timestamp = new Date().toISOString();

  if (rawError instanceof ProviderCallError) {
    const { statusCode, retryAfterHeader, rawBody } = rawError;
    const retryAfterMs = parseRetryAfter(retryAfterHeader);

    let type: ProviderErrorType;
    let retryable: boolean;
    let quotaExhausted = false;

    if (statusCode === 429) {
      if (bodyLooksQuotaExhausted(rawBody)) {
        type = "quota_exhausted";
        retryable = false;
        quotaExhausted = true;
      } else {
        type = "temporarily_rate_limited";
        retryable = true;
      }
    } else if (statusCode === 401) {
      type = "authentication_error";
      retryable = false;
    } else if (statusCode === 403) {
      type = "permission_error";
      retryable = false;
    } else if (statusCode === 408) {
      type = "timeout";
      retryable = true;
    } else if (statusCode !== null && statusCode >= 500) {
      type = "server_error";
      retryable = true;
    } else if (statusCode !== null && rawBody === null) {
      type = "malformed_response";
      retryable = false;
    } else {
      type = "unknown_error";
      retryable = false;
    }

    return {
      provider,
      model,
      type,
      statusCode,
      retryable,
      quotaExhausted,
      retryAfterMs,
      message: sanitizeMessage(type, statusCode, provider),
      timestamp,
    };
  }

  // Duck-typed handling for SDK-specific HTTP error shapes we don't want to
  // import here (e.g. @google/generative-ai's GoogleGenerativeAIFetchError,
  // which exposes a numeric `.status` and a `.message` containing the body) —
  // routed through the same classification as ProviderCallError.
  if (
    rawError instanceof Error &&
    typeof (rawError as { status?: unknown }).status === "number"
  ) {
    const statusCode = (rawError as unknown as { status: number }).status;
    return normalizeProviderError(
      provider,
      model,
      new ProviderCallError(rawError.message, statusCode, null, rawError.message)
    );
  }

  if (rawError instanceof Error) {
    const name = rawError.name || "";
    const isAbort = name === "AbortError" || name === "TimeoutError";
    if (isAbort) {
      return {
        provider,
        model,
        type: "timeout",
        statusCode: null,
        retryable: true,
        quotaExhausted: false,
        retryAfterMs: null,
        message: sanitizeMessage("timeout", null, provider),
        timestamp,
      };
    }

    // Node/undici network-level failures (fetch throws with a `cause`, or a
    // classic Node error code like ECONNREFUSED/ENOTFOUND/EAI_AGAIN).
    const code = (rawError as NodeJS.ErrnoException).code;
    const causeCode = (rawError as { cause?: NodeJS.ErrnoException }).cause?.code;
    const networkCodes = ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ECONNRESET", "ETIMEDOUT"];
    if ((code && networkCodes.includes(code)) || (causeCode && networkCodes.includes(causeCode))) {
      return {
        provider,
        model,
        type: "network_error",
        statusCode: null,
        retryable: true,
        quotaExhausted: false,
        retryAfterMs: null,
        message: sanitizeMessage("network_error", null, provider),
        timestamp,
      };
    }

    if (name === "SyntaxError") {
      return {
        provider,
        model,
        type: "malformed_response",
        statusCode: null,
        retryable: false,
        quotaExhausted: false,
        retryAfterMs: null,
        message: sanitizeMessage("malformed_response", null, provider),
        timestamp,
      };
    }
  }

  return {
    provider,
    model,
    type: "unknown_error",
    statusCode: null,
    retryable: false,
    quotaExhausted: false,
    retryAfterMs: null,
    message: sanitizeMessage("unknown_error", null, provider),
    timestamp,
  };
}

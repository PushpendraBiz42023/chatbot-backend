import { NormalizedProviderError } from "./provider-error";

export type ProviderStatus =
  | "available"
  | "temporarily_rate_limited"
  | "quota_exhausted"
  | "unavailable"
  | "configuration_error"
  | "authentication_error"
  | "network_error"
  | "unknown_error";

export interface ProviderStatusEntry {
  status: ProviderStatus;
  lastError: NormalizedProviderError | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  cooldownUntil: string | null;
}

function initialEntry(): ProviderStatusEntry {
  return { status: "available", lastError: null, lastSuccessAt: null, lastFailureAt: null, cooldownUntil: null };
}

/**
 * Simple in-memory (per-process) provider status tracker — this app has no
 * Redis/shared cache and targets a single-process deployment, consistent
 * with the rest of the codebase. KNOWN LIMITATION: status is not shared
 * across horizontally-scaled instances; each process tracks its own view.
 * This is the single source of truth for provider health, backing
 * `fallbackOptions.available`, `GET /api/chat/provider-status`, and the
 * admin status view — do not duplicate this tracking anywhere else.
 */
class ProviderStatusStore {
  private readonly entries = new Map<string, ProviderStatusEntry>();

  private getOrInit(provider: string): ProviderStatusEntry {
    let entry = this.entries.get(provider);
    if (!entry) {
      entry = initialEntry();
      this.entries.set(provider, entry);
    }
    return entry;
  }

  recordSuccess(provider: string): void {
    const entry = this.getOrInit(provider);
    entry.status = "available";
    entry.lastSuccessAt = new Date().toISOString();
    entry.lastError = null;
    entry.cooldownUntil = null;
  }

  recordFailure(provider: string, error: NormalizedProviderError, cooldownMs: number | null): void {
    const entry = this.getOrInit(provider);
    entry.status = this.statusFromErrorType(error.type);
    entry.lastFailureAt = error.timestamp;
    entry.lastError = error;
    entry.cooldownUntil = cooldownMs !== null ? new Date(Date.now() + cooldownMs).toISOString() : entry.cooldownUntil;
  }

  private statusFromErrorType(type: NormalizedProviderError["type"]): ProviderStatus {
    switch (type) {
      case "temporarily_rate_limited":
        return "temporarily_rate_limited";
      case "quota_exhausted":
        return "quota_exhausted";
      case "authentication_error":
        return "authentication_error";
      case "configuration_error":
        return "configuration_error";
      case "network_error":
        return "network_error";
      case "permission_error":
      case "timeout":
      case "server_error":
      case "malformed_response":
        return "unavailable";
      case "unknown_error":
      default:
        return "unknown_error";
    }
  }

  get(provider: string): ProviderStatusEntry {
    return this.getOrInit(provider);
  }

  /** True if the provider is currently usable (not in a known-bad cooldown / hard-failure state). */
  isAvailable(provider: string): boolean {
    const entry = this.entries.get(provider);
    if (!entry) return true; // never attempted -> assume available
    const badStatuses: ProviderStatus[] = ["quota_exhausted", "configuration_error", "authentication_error"];
    if (badStatuses.includes(entry.status)) return false;
    if (entry.cooldownUntil && new Date(entry.cooldownUntil).getTime() > Date.now()) return false;
    return true;
  }
}

export const providerStatusStore = new ProviderStatusStore();

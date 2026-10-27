"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerStatusStore = void 0;
function initialEntry() {
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
    constructor() {
        this.entries = new Map();
    }
    getOrInit(provider) {
        let entry = this.entries.get(provider);
        if (!entry) {
            entry = initialEntry();
            this.entries.set(provider, entry);
        }
        return entry;
    }
    recordSuccess(provider) {
        const entry = this.getOrInit(provider);
        entry.status = "available";
        entry.lastSuccessAt = new Date().toISOString();
        entry.lastError = null;
        entry.cooldownUntil = null;
    }
    recordFailure(provider, error, cooldownMs) {
        const entry = this.getOrInit(provider);
        entry.status = this.statusFromErrorType(error.type);
        entry.lastFailureAt = error.timestamp;
        entry.lastError = error;
        entry.cooldownUntil = cooldownMs !== null ? new Date(Date.now() + cooldownMs).toISOString() : entry.cooldownUntil;
    }
    statusFromErrorType(type) {
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
    get(provider) {
        return this.getOrInit(provider);
    }
    /** True if the provider is currently usable (not in a known-bad cooldown / hard-failure state). */
    isAvailable(provider) {
        const entry = this.entries.get(provider);
        if (!entry)
            return true; // never attempted -> assume available
        const badStatuses = ["quota_exhausted", "configuration_error", "authentication_error"];
        if (badStatuses.includes(entry.status))
            return false;
        if (entry.cooldownUntil && new Date(entry.cooldownUntil).getTime() > Date.now())
            return false;
        return true;
    }
}
exports.providerStatusStore = new ProviderStatusStore();
//# sourceMappingURL=provider-status.store.js.map
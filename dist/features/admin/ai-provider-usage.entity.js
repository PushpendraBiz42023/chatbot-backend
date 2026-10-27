"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiProviderUsage = exports.AiProviderUsageStatus = void 0;
const typeorm_1 = require("typeorm");
var AiProviderUsageStatus;
(function (AiProviderUsageStatus) {
    AiProviderUsageStatus["SUCCESS"] = "success";
    AiProviderUsageStatus["ERROR"] = "error";
})(AiProviderUsageStatus || (exports.AiProviderUsageStatus = AiProviderUsageStatus = {}));
/**
 * One row per real provider call attempt (including individual retries).
 * Metadata only — request/response text is NEVER stored here, consistent
 * with this table's purpose as usage/health telemetry, not conversation data.
 */
let AiProviderUsage = class AiProviderUsage {
};
exports.AiProviderUsage = AiProviderUsage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AiProviderUsage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], AiProviderUsage.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], AiProviderUsage.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, name: "conversation_id", nullable: true }),
    __metadata("design:type", Object)
], AiProviderUsage.prototype, "conversationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, name: "user_id", nullable: true }),
    __metadata("design:type", Object)
], AiProviderUsage.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: AiProviderUsageStatus }),
    __metadata("design:type", String)
], AiProviderUsage.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, name: "error_type", nullable: true }),
    __metadata("design:type", Object)
], AiProviderUsage.prototype, "errorType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", name: "input_tokens", nullable: true }),
    __metadata("design:type", Object)
], AiProviderUsage.prototype, "inputTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", name: "output_tokens", nullable: true }),
    __metadata("design:type", Object)
], AiProviderUsage.prototype, "outputTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", name: "total_tokens", nullable: true }),
    __metadata("design:type", Object)
], AiProviderUsage.prototype, "totalTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", name: "latency_ms" }),
    __metadata("design:type", Number)
], AiProviderUsage.prototype, "latencyMs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], AiProviderUsage.prototype, "createdAt", void 0);
exports.AiProviderUsage = AiProviderUsage = __decorate([
    (0, typeorm_1.Entity)({ name: "ai_provider_usage" }),
    (0, typeorm_1.Index)(["provider", "model"]),
    (0, typeorm_1.Index)(["createdAt"])
], AiProviderUsage);
//# sourceMappingURL=ai-provider-usage.entity.js.map
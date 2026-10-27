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
exports.KnowledgeEntry = exports.KnowledgeStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../auth/user.entity");
var KnowledgeStatus;
(function (KnowledgeStatus) {
    KnowledgeStatus["ACTIVE"] = "active";
    KnowledgeStatus["DISABLED"] = "disabled";
})(KnowledgeStatus || (exports.KnowledgeStatus = KnowledgeStatus = {}));
let KnowledgeEntry = class KnowledgeEntry {
};
exports.KnowledgeEntry = KnowledgeEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 200 }),
    __metadata("design:type", String)
], KnowledgeEntry.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], KnowledgeEntry.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500, nullable: true }),
    __metadata("design:type", Object)
], KnowledgeEntry.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "mediumtext" }),
    __metadata("design:type", String)
], KnowledgeEntry.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: KnowledgeStatus, default: KnowledgeStatus.ACTIVE }),
    __metadata("design:type", String)
], KnowledgeEntry.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, name: "created_by" }),
    __metadata("design:type", String)
], KnowledgeEntry.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", user_entity_1.User)
], KnowledgeEntry.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], KnowledgeEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], KnowledgeEntry.prototype, "updatedAt", void 0);
exports.KnowledgeEntry = KnowledgeEntry = __decorate([
    (0, typeorm_1.Entity)({ name: "knowledge_entries" })
], KnowledgeEntry);
//# sourceMappingURL=knowledge-entry.entity.js.map
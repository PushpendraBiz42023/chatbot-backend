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
exports.KnowledgeDocument = exports.DocumentStatus = exports.DocumentSourceType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../auth/user.entity");
var DocumentSourceType;
(function (DocumentSourceType) {
    DocumentSourceType["PDF"] = "pdf";
    DocumentSourceType["DOC"] = "doc";
    DocumentSourceType["DOCX"] = "docx";
    DocumentSourceType["TXT"] = "txt";
    DocumentSourceType["IMAGE"] = "image";
})(DocumentSourceType || (exports.DocumentSourceType = DocumentSourceType = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PROCESSING"] = "processing";
    DocumentStatus["READY"] = "ready";
    DocumentStatus["FAILED"] = "failed";
    DocumentStatus["DISABLED"] = "disabled";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
/**
 * A single uploaded, admin-managed source document (Feature 4). Once
 * successfully processed, its extracted text is split into
 * `knowledge_chunks` rows (via `documentId`) exactly like manual
 * `knowledge_entries` are, so it grounds chat responses through the same
 * unmodified retrieval path built in Feature 3.
 *
 * `storageKey` — NOT `originalFilename` — is the only thing ever used to
 * build the on-disk path (see documents.storage.ts); `originalFilename` is
 * sanitized for DISPLAY ONLY and must never reach the filesystem layer.
 */
let KnowledgeDocument = class KnowledgeDocument {
};
exports.KnowledgeDocument = KnowledgeDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500, nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: DocumentSourceType, name: "source_type" }),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "sourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, name: "original_filename" }),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "originalFilename", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, name: "storage_key" }),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "storageKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, name: "mime_type" }),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", name: "file_size" }),
    __metadata("design:type", Number)
], KnowledgeDocument.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: DocumentStatus, default: DocumentStatus.PROCESSING }),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", name: "processing_error", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeDocument.prototype, "processingError", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, name: "created_by" }),
    __metadata("design:type", String)
], KnowledgeDocument.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", user_entity_1.User)
], KnowledgeDocument.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], KnowledgeDocument.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], KnowledgeDocument.prototype, "updatedAt", void 0);
exports.KnowledgeDocument = KnowledgeDocument = __decorate([
    (0, typeorm_1.Entity)({ name: "knowledge_documents" })
], KnowledgeDocument);
//# sourceMappingURL=knowledge-document.entity.js.map
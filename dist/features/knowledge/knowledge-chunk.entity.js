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
exports.KnowledgeChunk = void 0;
const typeorm_1 = require("typeorm");
const knowledge_entry_entity_1 = require("./knowledge-entry.entity");
const knowledge_document_entity_1 = require("../documents/knowledge-document.entity");
/**
 * Retrieval unit for grounding chat responses in admin knowledge. Populated
 * from `knowledge_entries` (`entryId`) or from Feature 4's uploaded
 * `knowledge_documents` (`documentId`) — exactly one of the two is set per
 * row. Both FKs cascade-delete, so removing an entry or a document cleans up
 * its chunks automatically.
 *
 * `embedding` is stored via `simple-json` (a plain number[]) rather than a
 * native vector column: MySQL/MariaDB here has no vector type, and the spec
 * explicitly rules out adding a separate vector database, so similarity is
 * computed in application code (see services/rag/similarity.ts).
 */
let KnowledgeChunk = class KnowledgeChunk {
};
exports.KnowledgeChunk = KnowledgeChunk;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], KnowledgeChunk.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", length: 36, name: "entry_id", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeChunk.prototype, "entryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => knowledge_entry_entity_1.KnowledgeEntry, { onDelete: "CASCADE", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "entry_id" }),
    __metadata("design:type", Object)
], KnowledgeChunk.prototype, "entry", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", length: 36, name: "document_id", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeChunk.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => knowledge_document_entity_1.KnowledgeDocument, { onDelete: "CASCADE", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "document_id" }),
    __metadata("design:type", Object)
], KnowledgeChunk.prototype, "document", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", name: "chunk_index", default: 0 }),
    __metadata("design:type", Number)
], KnowledgeChunk.prototype, "chunkIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "mediumtext" }),
    __metadata("design:type", String)
], KnowledgeChunk.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Array)
], KnowledgeChunk.prototype, "embedding", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", nullable: true }),
    __metadata("design:type", Object)
], KnowledgeChunk.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], KnowledgeChunk.prototype, "createdAt", void 0);
exports.KnowledgeChunk = KnowledgeChunk = __decorate([
    (0, typeorm_1.Entity)({ name: "knowledge_chunks" })
], KnowledgeChunk);
//# sourceMappingURL=knowledge-chunk.entity.js.map
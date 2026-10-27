"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const AppError_1 = require("../../utils/AppError");
const knowledge_repository_1 = require("./knowledge.repository");
const knowledge_entry_entity_1 = require("./knowledge-entry.entity");
const knowledge_embedding_sync_1 = require("./knowledge-embedding.sync");
function toDto(entry) {
    return {
        id: entry.id,
        title: entry.title,
        category: entry.category,
        tags: entry.tags,
        content: entry.content,
        status: entry.status,
        createdBy: entry.createdBy,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
    };
}
async function getEntryOrThrow(id) {
    const entry = await knowledge_repository_1.KnowledgeRepository.findById(id);
    if (!entry) {
        throw new AppError_1.AppError(404, "NOT_FOUND", "Knowledge entry not found");
    }
    return entry;
}
exports.KnowledgeService = {
    async list() {
        const entries = await knowledge_repository_1.KnowledgeRepository.listAll();
        return entries.map(toDto);
    },
    async create(createdBy, input) {
        const entry = await knowledge_repository_1.KnowledgeRepository.create({
            title: input.title,
            category: input.category ?? null,
            tags: input.tags ?? null,
            content: input.content,
            status: input.status ?? knowledge_entry_entity_1.KnowledgeStatus.ACTIVE,
            createdBy,
        });
        // Inline/awaited per MVP scope; failures are logged, not thrown, so a
        // broken embedding call never blocks the entry from saving.
        await (0, knowledge_embedding_sync_1.syncKnowledgeChunks)(entry);
        return toDto(entry);
    },
    async getOne(id) {
        const entry = await getEntryOrThrow(id);
        return toDto(entry);
    },
    async update(id, input) {
        await getEntryOrThrow(id);
        const updated = await knowledge_repository_1.KnowledgeRepository.update(id, {
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.category !== undefined ? { category: input.category } : {}),
            ...(input.tags !== undefined ? { tags: input.tags } : {}),
            ...(input.content !== undefined ? { content: input.content } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
        });
        if (!updated) {
            throw new AppError_1.AppError(404, "NOT_FOUND", "Knowledge entry not found");
        }
        // Only re-sync chunks when content or status actually changed — a
        // title/category/tags-only edit doesn't affect what's embedded.
        if (input.content !== undefined || input.status !== undefined) {
            await (0, knowledge_embedding_sync_1.syncKnowledgeChunks)(updated);
        }
        return toDto(updated);
    },
    async remove(id) {
        const deleted = await knowledge_repository_1.KnowledgeRepository.delete(id);
        if (!deleted) {
            throw new AppError_1.AppError(404, "NOT_FOUND", "Knowledge entry not found");
        }
    },
};
//# sourceMappingURL=knowledge.service.js.map
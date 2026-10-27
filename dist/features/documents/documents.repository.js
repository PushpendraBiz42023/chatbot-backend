"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsRepository = void 0;
const data_source_1 = require("../../database/data-source");
const knowledge_document_entity_1 = require("./knowledge-document.entity");
const documentRepo = () => data_source_1.AppDataSource.getRepository(knowledge_document_entity_1.KnowledgeDocument);
exports.DocumentsRepository = {
    async listAll() {
        return documentRepo().find({ order: { updatedAt: "DESC" } });
    },
    async findById(id) {
        return documentRepo().findOne({ where: { id } });
    },
    async create(data) {
        const document = documentRepo().create({ ...data, status: knowledge_document_entity_1.DocumentStatus.PROCESSING, processingError: null });
        return documentRepo().save(document);
    },
    async setStatus(id, status, processingError = null) {
        await documentRepo().update({ id }, { status, processingError });
    },
    async delete(id) {
        const result = await documentRepo().delete({ id });
        return (result.affected ?? 0) > 0;
    },
};
//# sourceMappingURL=documents.repository.js.map
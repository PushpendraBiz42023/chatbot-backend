"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeRepository = void 0;
const data_source_1 = require("../../database/data-source");
const knowledge_entry_entity_1 = require("./knowledge-entry.entity");
const knowledgeRepo = () => data_source_1.AppDataSource.getRepository(knowledge_entry_entity_1.KnowledgeEntry);
exports.KnowledgeRepository = {
    async listAll() {
        return knowledgeRepo().find({
            order: { updatedAt: "DESC" },
        });
    },
    async findById(id) {
        return knowledgeRepo().findOne({ where: { id } });
    },
    async create(data) {
        const entry = knowledgeRepo().create(data);
        return knowledgeRepo().save(entry);
    },
    async update(id, changes) {
        await knowledgeRepo().update({ id }, changes);
        return knowledgeRepo().findOne({ where: { id } });
    },
    async delete(id) {
        const result = await knowledgeRepo().delete({ id });
        return (result.affected ?? 0) > 0;
    },
};
//# sourceMappingURL=knowledge.repository.js.map
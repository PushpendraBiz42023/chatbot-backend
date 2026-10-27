"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeController = void 0;
const knowledge_service_1 = require("./knowledge.service");
const apiResponse_1 = require("../../utils/apiResponse");
const knowledge_validation_1 = require("./knowledge.validation");
exports.KnowledgeController = {
    async list(_req, res, next) {
        try {
            const entries = await knowledge_service_1.KnowledgeService.list();
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { entries });
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const input = knowledge_validation_1.createKnowledgeSchema.parse(req.body);
            const entry = await knowledge_service_1.KnowledgeService.create(req.userId, input);
            (0, apiResponse_1.sendSuccess)(res, 201, "Knowledge entry created", { entry });
        }
        catch (error) {
            next(error);
        }
    },
    async getOne(req, res, next) {
        try {
            const { id } = knowledge_validation_1.knowledgeIdParamSchema.parse(req.params);
            const entry = await knowledge_service_1.KnowledgeService.getOne(id);
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { entry });
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const { id } = knowledge_validation_1.knowledgeIdParamSchema.parse(req.params);
            const input = knowledge_validation_1.updateKnowledgeSchema.parse(req.body);
            const entry = await knowledge_service_1.KnowledgeService.update(id, input);
            (0, apiResponse_1.sendSuccess)(res, 200, "Knowledge entry updated", { entry });
        }
        catch (error) {
            next(error);
        }
    },
    async remove(req, res, next) {
        try {
            const { id } = knowledge_validation_1.knowledgeIdParamSchema.parse(req.params);
            await knowledge_service_1.KnowledgeService.remove(id);
            (0, apiResponse_1.sendSuccess)(res, 200, "Knowledge entry deleted");
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=knowledge.controller.js.map
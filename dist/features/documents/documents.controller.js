"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsController = void 0;
const documents_service_1 = require("./documents.service");
const apiResponse_1 = require("../../utils/apiResponse");
const AppError_1 = require("../../utils/AppError");
const documents_validation_1 = require("./documents.validation");
exports.DocumentsController = {
    async list(_req, res, next) {
        try {
            const documents = await documents_service_1.DocumentsService.list();
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { documents });
        }
        catch (error) {
            next(error);
        }
    },
    async getOne(req, res, next) {
        try {
            const { id } = documents_validation_1.documentIdParamSchema.parse(req.params);
            const document = await documents_service_1.DocumentsService.getOne(id);
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { document });
        }
        catch (error) {
            next(error);
        }
    },
    async upload(req, res, next) {
        try {
            if (!req.file) {
                throw new AppError_1.AppError(400, "FILE_REQUIRED", "A file is required.");
            }
            const input = documents_validation_1.uploadDocumentSchema.parse(req.body);
            const document = await documents_service_1.DocumentsService.upload(req.userId, req.file, input);
            (0, apiResponse_1.sendSuccess)(res, 201, "Document uploaded", { document });
        }
        catch (error) {
            next(error);
        }
    },
    async remove(req, res, next) {
        try {
            const { id } = documents_validation_1.documentIdParamSchema.parse(req.params);
            await documents_service_1.DocumentsService.remove(id);
            (0, apiResponse_1.sendSuccess)(res, 200, "Document deleted");
        }
        catch (error) {
            next(error);
        }
    },
    async reprocess(req, res, next) {
        try {
            const { id } = documents_validation_1.documentIdParamSchema.parse(req.params);
            const document = await documents_service_1.DocumentsService.reprocess(id);
            (0, apiResponse_1.sendSuccess)(res, 200, "Document reprocessed", { document });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=documents.controller.js.map
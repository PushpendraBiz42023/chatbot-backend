"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const apiResponse_1 = require("../../utils/apiResponse");
const admin_validation_1 = require("./admin.validation");
exports.AdminController = {
    async getStats(_req, res, next) {
        try {
            const stats = await admin_service_1.AdminService.getStats();
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", stats);
        }
        catch (error) {
            next(error);
        }
    },
    async listUsers(_req, res, next) {
        try {
            const users = await admin_service_1.AdminService.listUsers();
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { users });
        }
        catch (error) {
            next(error);
        }
    },
    async listUserConversations(req, res, next) {
        try {
            const { userId } = admin_validation_1.adminUserIdParamSchema.parse(req.params);
            const conversations = await admin_service_1.AdminService.listUserConversations(userId);
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { conversations });
        }
        catch (error) {
            next(error);
        }
    },
    async getProviderStatus(_req, res, next) {
        try {
            const providers = await admin_service_1.AdminService.getProviderStatus();
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { providers });
        }
        catch (error) {
            next(error);
        }
    },
    async getProviderUsage(_req, res, next) {
        try {
            const usage = await admin_service_1.AdminService.getProviderUsage();
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { usage });
        }
        catch (error) {
            next(error);
        }
    },
    async getUserConversationMessages(req, res, next) {
        try {
            const { userId, conversationId } = admin_validation_1.adminUserConversationParamSchema.parse(req.params);
            const messages = await admin_service_1.AdminService.getUserConversationMessages(req.userId, userId, conversationId);
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { messages });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=admin.controller.js.map
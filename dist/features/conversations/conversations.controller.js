"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsController = void 0;
const conversations_service_1 = require("./conversations.service");
const apiResponse_1 = require("../../utils/apiResponse");
const conversations_validation_1 = require("./conversations.validation");
exports.ConversationsController = {
    async list(req, res, next) {
        try {
            const conversations = await conversations_service_1.ConversationsService.list(req.userId);
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { conversations });
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const conversation = await conversations_service_1.ConversationsService.create(req.userId);
            (0, apiResponse_1.sendSuccess)(res, 201, "Conversation created", { conversation });
        }
        catch (error) {
            next(error);
        }
    },
    async getOne(req, res, next) {
        try {
            const { id } = conversations_validation_1.conversationIdParamSchema.parse(req.params);
            const conversation = await conversations_service_1.ConversationsService.getOne(id, req.userId);
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { conversation });
        }
        catch (error) {
            next(error);
        }
    },
    async getMessages(req, res, next) {
        try {
            const { id } = conversations_validation_1.conversationIdParamSchema.parse(req.params);
            const messages = await conversations_service_1.ConversationsService.getMessages(id, req.userId);
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { messages });
        }
        catch (error) {
            next(error);
        }
    },
    async rename(req, res, next) {
        try {
            const { id } = conversations_validation_1.conversationIdParamSchema.parse(req.params);
            const { title } = conversations_validation_1.renameConversationSchema.parse(req.body);
            const conversation = await conversations_service_1.ConversationsService.rename(id, req.userId, title);
            (0, apiResponse_1.sendSuccess)(res, 200, "Conversation renamed", { conversation });
        }
        catch (error) {
            next(error);
        }
    },
    async switchProvider(req, res, next) {
        try {
            const { id } = conversations_validation_1.conversationIdParamSchema.parse(req.params);
            const { provider } = conversations_validation_1.switchProviderSchema.parse(req.body);
            const conversation = await conversations_service_1.ConversationsService.switchProvider(id, req.userId, provider);
            (0, apiResponse_1.sendSuccess)(res, 200, "Provider switched", { conversation });
        }
        catch (error) {
            next(error);
        }
    },
    async remove(req, res, next) {
        try {
            const { id } = conversations_validation_1.conversationIdParamSchema.parse(req.params);
            await conversations_service_1.ConversationsService.remove(id, req.userId);
            (0, apiResponse_1.sendSuccess)(res, 200, "Conversation deleted");
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=conversations.controller.js.map
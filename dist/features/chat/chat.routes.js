"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = void 0;
const express_1 = require("express");
const chat_controller_1 = require("./chat.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
exports.chatRoutes = router;
router.post("/", auth_middleware_1.authMiddleware, rateLimit_middleware_1.chatRateLimiter, chat_controller_1.ChatController.chat);
router.get("/provider-status", auth_middleware_1.authMiddleware, rateLimit_middleware_1.providerStatusRateLimiter, chat_controller_1.ChatController.getProviderStatus);
//# sourceMappingURL=chat.routes.js.map
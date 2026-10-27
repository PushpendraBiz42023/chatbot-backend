"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationsRoutes = void 0;
const express_1 = require("express");
const conversations_controller_1 = require("./conversations.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
exports.conversationsRoutes = router;
router.use(auth_middleware_1.authMiddleware);
router.get("/", conversations_controller_1.ConversationsController.list);
router.post("/", conversations_controller_1.ConversationsController.create);
router.get("/:id", conversations_controller_1.ConversationsController.getOne);
router.get("/:id/messages", conversations_controller_1.ConversationsController.getMessages);
router.patch("/:id", conversations_controller_1.ConversationsController.rename);
router.patch("/:id/provider", conversations_controller_1.ConversationsController.switchProvider);
router.delete("/:id", conversations_controller_1.ConversationsController.remove);
//# sourceMappingURL=conversations.routes.js.map
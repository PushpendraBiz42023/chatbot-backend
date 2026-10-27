"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const admin_middleware_1 = require("../../middleware/admin.middleware");
const router = (0, express_1.Router)();
exports.adminRoutes = router;
router.use(auth_middleware_1.authMiddleware);
router.use(admin_middleware_1.requireAdmin);
router.get("/stats", admin_controller_1.AdminController.getStats);
router.get("/providers/status", admin_controller_1.AdminController.getProviderStatus);
router.get("/providers/usage", admin_controller_1.AdminController.getProviderUsage);
router.get("/users", admin_controller_1.AdminController.listUsers);
router.get("/users/:userId/conversations", admin_controller_1.AdminController.listUserConversations);
router.get("/users/:userId/conversations/:conversationId/messages", admin_controller_1.AdminController.getUserConversationMessages);
//# sourceMappingURL=admin.routes.js.map
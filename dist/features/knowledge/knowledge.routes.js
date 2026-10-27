"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeRoutes = void 0;
const express_1 = require("express");
const knowledge_controller_1 = require("./knowledge.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const admin_middleware_1 = require("../../middleware/admin.middleware");
const router = (0, express_1.Router)();
exports.knowledgeRoutes = router;
router.use(auth_middleware_1.authMiddleware);
router.use(admin_middleware_1.requireAdmin);
router.get("/", knowledge_controller_1.KnowledgeController.list);
router.post("/", knowledge_controller_1.KnowledgeController.create);
router.get("/:id", knowledge_controller_1.KnowledgeController.getOne);
router.patch("/:id", knowledge_controller_1.KnowledgeController.update);
router.delete("/:id", knowledge_controller_1.KnowledgeController.remove);
//# sourceMappingURL=knowledge.routes.js.map
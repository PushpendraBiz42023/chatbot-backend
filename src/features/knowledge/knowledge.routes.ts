import { Router } from "express";
import { KnowledgeController } from "./knowledge.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get("/", KnowledgeController.list);
router.post("/", KnowledgeController.create);
router.get("/:id", KnowledgeController.getOne);
router.patch("/:id", KnowledgeController.update);
router.delete("/:id", KnowledgeController.remove);

export { router as knowledgeRoutes };

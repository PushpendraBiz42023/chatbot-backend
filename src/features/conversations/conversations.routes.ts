import { Router } from "express";
import { ConversationsController } from "./conversations.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", ConversationsController.list);
router.post("/", ConversationsController.create);
router.get("/:id", ConversationsController.getOne);
router.get("/:id/messages", ConversationsController.getMessages);
router.patch("/:id", ConversationsController.rename);
router.patch("/:id/provider", ConversationsController.switchProvider);
router.delete("/:id", ConversationsController.remove);

export { router as conversationsRoutes };

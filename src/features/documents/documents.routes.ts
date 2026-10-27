import { Router } from "express";
import { DocumentsController } from "./documents.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";
import { handleUploadError, uploadSingleDocument } from "./documents.upload.middleware";

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get("/", DocumentsController.list);
router.post("/", uploadSingleDocument, handleUploadError, DocumentsController.upload);
router.get("/:id", DocumentsController.getOne);
router.delete("/:id", DocumentsController.remove);
router.post("/:id/reprocess", DocumentsController.reprocess);

export { router as documentsRoutes };

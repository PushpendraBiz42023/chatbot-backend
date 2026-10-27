"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentsRoutes = void 0;
const express_1 = require("express");
const documents_controller_1 = require("./documents.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const admin_middleware_1 = require("../../middleware/admin.middleware");
const documents_upload_middleware_1 = require("./documents.upload.middleware");
const router = (0, express_1.Router)();
exports.documentsRoutes = router;
router.use(auth_middleware_1.authMiddleware);
router.use(admin_middleware_1.requireAdmin);
router.get("/", documents_controller_1.DocumentsController.list);
router.post("/", documents_upload_middleware_1.uploadSingleDocument, documents_upload_middleware_1.handleUploadError, documents_controller_1.DocumentsController.upload);
router.get("/:id", documents_controller_1.DocumentsController.getOne);
router.delete("/:id", documents_controller_1.DocumentsController.remove);
router.post("/:id/reprocess", documents_controller_1.DocumentsController.reprocess);
//# sourceMappingURL=documents.routes.js.map
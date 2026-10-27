"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const apiResponse_1 = require("../utils/apiResponse");
const user_entity_1 = require("../features/auth/user.entity");
/**
 * Must run AFTER `authMiddleware` (which sets `req.userRole` from a verified
 * DB lookup — never from request body/query). This is the actual security
 * boundary for admin-only routes; any UI-level hiding of admin nav items is
 * cosmetic only.
 */
function requireAdmin(req, res, next) {
    if (req.userRole !== user_entity_1.UserRole.ADMIN) {
        (0, apiResponse_1.sendError)(res, 403, "Admin access required", "ADMIN_REQUIRED");
        return;
    }
    next();
}
//# sourceMappingURL=admin.middleware.js.map
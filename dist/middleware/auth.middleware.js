"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const token_1 = require("../utils/token");
const apiResponse_1 = require("../utils/apiResponse");
const auth_repository_1 = require("../features/auth/auth.repository");
/**
 * `role` is loaded from the DB on every authenticated request (rather than
 * embedded in the JWT payload) so that promoting/demoting a user's role takes
 * effect immediately, without waiting for their access token to expire or be
 * refreshed. Tradeoff: one extra indexed primary-key lookup per authenticated
 * request; acceptable at this scale and safer for an admin-gating boundary.
 */
async function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        (0, apiResponse_1.sendError)(res, 401, "Authentication required", "UNAUTHORIZED");
        return;
    }
    const token = header.slice("Bearer ".length).trim();
    if (!token) {
        (0, apiResponse_1.sendError)(res, 401, "Authentication required", "UNAUTHORIZED");
        return;
    }
    try {
        const payload = (0, token_1.verifyAccessToken)(token);
        const user = await auth_repository_1.AuthRepository.findUserById(payload.sub);
        if (!user) {
            (0, apiResponse_1.sendError)(res, 401, "Invalid authentication token", "UNAUTHORIZED");
            return;
        }
        req.userId = payload.sub;
        req.userEmail = payload.email;
        req.userRole = user.role;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            (0, apiResponse_1.sendError)(res, 401, "Session expired, please log in again", "UNAUTHORIZED");
            return;
        }
        (0, apiResponse_1.sendError)(res, 401, "Invalid authentication token", "UNAUTHORIZED");
    }
}
//# sourceMappingURL=auth.middleware.js.map
import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/apiResponse";
import { UserRole } from "../features/auth/user.entity";

/**
 * Must run AFTER `authMiddleware` (which sets `req.userRole` from a verified
 * DB lookup — never from request body/query). This is the actual security
 * boundary for admin-only routes; any UI-level hiding of admin nav items is
 * cosmetic only.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== UserRole.ADMIN) {
    sendError(res, 403, "Admin access required", "ADMIN_REQUIRED");
    return;
  }
  next();
}

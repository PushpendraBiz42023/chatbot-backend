import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/token";
import { sendError } from "../utils/apiResponse";
import { AuthRepository } from "../features/auth/auth.repository";
import { UserRole } from "../features/auth/user.entity";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: UserRole;
    }
  }
}

/**
 * `role` is loaded from the DB on every authenticated request (rather than
 * embedded in the JWT payload) so that promoting/demoting a user's role takes
 * effect immediately, without waiting for their access token to expire or be
 * refreshed. Tradeoff: one extra indexed primary-key lookup per authenticated
 * request; acceptable at this scale and safer for an admin-gating boundary.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    sendError(res, 401, "Authentication required", "UNAUTHORIZED");
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    sendError(res, 401, "Authentication required", "UNAUTHORIZED");
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    const user = await AuthRepository.findUserById(payload.sub);
    if (!user) {
      sendError(res, 401, "Invalid authentication token", "UNAUTHORIZED");
      return;
    }

    req.userId = payload.sub;
    req.userEmail = payload.email;
    req.userRole = user.role;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendError(res, 401, "Session expired, please log in again", "UNAUTHORIZED");
      return;
    }
    sendError(res, 401, "Invalid authentication token", "UNAUTHORIZED");
  }
}

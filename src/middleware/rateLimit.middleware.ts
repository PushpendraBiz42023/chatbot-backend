import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { sendError } from "../utils/apiResponse";

function rateLimitHandler(_req: Request, res: Response): void {
  sendError(res, 429, "Too many requests. Please try again later.", "RATE_LIMITED");
}

function emailKey(req: Request): string {
  const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "unknown";
  return `${req.ip}:${email}`;
}

function chatRateLimitHandler(_req: Request, res: Response): void {
  sendError(res, 429, "Too many chat requests. Please slow down and try again shortly.", "AI_RATE_LIMITED");
}

function userIdKey(req: Request): string {
  // authMiddleware runs before this limiter on the chat route, so req.userId
  // is always set here; the fallback only guards against misconfigured order.
  return req.userId ?? req.ip ?? "unknown";
}

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKey,
  handler: rateLimitHandler,
});

export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const otpResendRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKey,
  handler: rateLimitHandler,
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKey,
  handler: rateLimitHandler,
});

export const resetPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKey,
  handler: rateLimitHandler,
});

export const verifyOtpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKey,
  handler: rateLimitHandler,
});

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userIdKey,
  handler: chatRateLimitHandler,
});

// Generous limit: this must be safe to call somewhat freely (e.g. the
// frontend's "Retry configured providers" action), it just shouldn't be
// hammerable.
export const providerStatusRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userIdKey,
  handler: rateLimitHandler,
});

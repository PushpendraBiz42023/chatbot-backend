"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerStatusRateLimiter = exports.chatRateLimiter = exports.verifyOtpRateLimiter = exports.resetPasswordRateLimiter = exports.forgotPasswordRateLimiter = exports.otpResendRateLimiter = exports.signupRateLimiter = exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const apiResponse_1 = require("../utils/apiResponse");
function rateLimitHandler(_req, res) {
    (0, apiResponse_1.sendError)(res, 429, "Too many requests. Please try again later.", "RATE_LIMITED");
}
function emailKey(req) {
    const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "unknown";
    return `${req.ip}:${email}`;
}
function chatRateLimitHandler(_req, res) {
    (0, apiResponse_1.sendError)(res, 429, "Too many chat requests. Please slow down and try again shortly.", "AI_RATE_LIMITED");
}
function userIdKey(req) {
    // authMiddleware runs before this limiter on the chat route, so req.userId
    // is always set here; the fallback only guards against misconfigured order.
    return req.userId ?? req.ip ?? "unknown";
}
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: emailKey,
    handler: rateLimitHandler,
});
exports.signupRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});
exports.otpResendRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: emailKey,
    handler: rateLimitHandler,
});
exports.forgotPasswordRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: emailKey,
    handler: rateLimitHandler,
});
exports.resetPasswordRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: emailKey,
    handler: rateLimitHandler,
});
exports.verifyOtpRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: emailKey,
    handler: rateLimitHandler,
});
exports.chatRateLimiter = (0, express_rate_limit_1.default)({
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
exports.providerStatusRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userIdKey,
    handler: rateLimitHandler,
});
//# sourceMappingURL=rateLimit.middleware.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOKIE_OPTIONS = exports.SESSION_TOKEN_BYTES = exports.RESET_TOKEN_BYTES = exports.RESET_TOKEN_EXPIRES_IN_MINUTES = exports.OTP_RESEND_COOLDOWN_SECONDS = exports.OTP_MAX_ATTEMPTS = exports.OTP_EXPIRES_IN_MINUTES = exports.OTP_LENGTH = exports.BCRYPT_COST_FACTOR = void 0;
const env_1 = require("./env");
exports.BCRYPT_COST_FACTOR = 12;
exports.OTP_LENGTH = 6;
exports.OTP_EXPIRES_IN_MINUTES = 10;
exports.OTP_MAX_ATTEMPTS = 5;
exports.OTP_RESEND_COOLDOWN_SECONDS = 60;
exports.RESET_TOKEN_EXPIRES_IN_MINUTES = 15;
exports.RESET_TOKEN_BYTES = 32;
exports.SESSION_TOKEN_BYTES = 32;
exports.COOKIE_OPTIONS = {
    name: env_1.env.session.cookieName,
    httpOnly: true,
    secure: env_1.env.isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: env_1.env.session.expiresInDays * 24 * 60 * 60 * 1000,
};
//# sourceMappingURL=constants.js.map
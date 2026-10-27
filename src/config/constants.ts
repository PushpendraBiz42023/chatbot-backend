import { env } from "./env";

export const BCRYPT_COST_FACTOR = 12;

export const OTP_LENGTH = 6;
export const OTP_EXPIRES_IN_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export const RESET_TOKEN_EXPIRES_IN_MINUTES = 15;
export const RESET_TOKEN_BYTES = 32;

export const SESSION_TOKEN_BYTES = 32;

export const COOKIE_OPTIONS = {
  name: env.session.cookieName,
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: env.session.expiresInDays * 24 * 60 * 60 * 1000,
};

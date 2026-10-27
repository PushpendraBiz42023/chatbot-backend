import crypto from "crypto";
import { OTP_LENGTH } from "../config/constants";
import { env } from "../config/env";

/** Generates a numeric OTP of OTP_LENGTH digits using a cryptographically secure RNG. */
export function generateOtp(): string {
  const max = 10 ** OTP_LENGTH;
  const value = crypto.randomInt(0, max);
  return value.toString().padStart(OTP_LENGTH, "0");
}

// A plain SHA-256 hash of a 6-digit code is only ~1,000,000 possibilities —
// trivial to brute-force offline (well under a second) by anyone who can read
// the `otp_verifications` table, bypassing the online rate limit entirely.
// Session/reset tokens are safe with plain SHA-256 because they're 256-bit
// random values, but a low-entropy OTP needs the hash to depend on a server
// secret too, so a leaked hash alone isn't enough to recover the code.
const otpHmacKey = crypto.createHash("sha256").update(`${env.jwt.secret}:otp-hmac-v1`).digest();

export function hashOtp(code: string): string {
  return crypto.createHmac("sha256", otpHmacKey).update(code).digest("hex");
}

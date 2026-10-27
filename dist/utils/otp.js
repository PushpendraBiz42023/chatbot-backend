"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = generateOtp;
exports.hashOtp = hashOtp;
const crypto_1 = __importDefault(require("crypto"));
const constants_1 = require("../config/constants");
const env_1 = require("../config/env");
/** Generates a numeric OTP of OTP_LENGTH digits using a cryptographically secure RNG. */
function generateOtp() {
    const max = 10 ** constants_1.OTP_LENGTH;
    const value = crypto_1.default.randomInt(0, max);
    return value.toString().padStart(constants_1.OTP_LENGTH, "0");
}
// A plain SHA-256 hash of a 6-digit code is only ~1,000,000 possibilities —
// trivial to brute-force offline (well under a second) by anyone who can read
// the `otp_verifications` table, bypassing the online rate limit entirely.
// Session/reset tokens are safe with plain SHA-256 because they're 256-bit
// random values, but a low-entropy OTP needs the hash to depend on a server
// secret too, so a leaked hash alone isn't enough to recover the code.
const otpHmacKey = crypto_1.default.createHash("sha256").update(`${env_1.env.jwt.secret}:otp-hmac-v1`).digest();
function hashOtp(code) {
    return crypto_1.default.createHmac("sha256", otpHmacKey).update(code).digest("hex");
}
//# sourceMappingURL=otp.js.map
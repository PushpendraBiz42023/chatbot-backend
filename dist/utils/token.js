"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.generateOpaqueToken = generateOpaqueToken;
exports.sha256Hash = sha256Hash;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function signAccessToken(payload) {
    const options = {
        expiresIn: env_1.env.jwt.accessExpiresIn,
        algorithm: "HS256",
        jwtid: crypto_1.default.randomUUID(),
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwt.secret, options);
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwt.secret, { algorithms: ["HS256"] });
}
/** Generates an opaque, URL-safe random token (used for sessions and reset tokens). */
function generateOpaqueToken(byteLength) {
    return crypto_1.default.randomBytes(byteLength).toString("base64url");
}
/** Hashes an opaque token with SHA-256 before persisting it, so raw tokens never touch the DB. */
function sha256Hash(value) {
    return crypto_1.default.createHash("sha256").update(value).digest("hex");
}
//# sourceMappingURL=token.js.map
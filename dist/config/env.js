"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
const REQUIRED_VARS = [
    "NODE_ENV",
    "PORT",
    "DB_HOST",
    "DB_PORT",
    "DB_USERNAME",
    "DB_PASSWORD",
    "DB_DATABASE",
    "JWT_SECRET",
    "JWT_ACCESS_EXPIRES_IN",
    "SESSION_COOKIE_NAME",
    "SESSION_TOKEN_EXPIRES_IN_DAYS",
    "CORS_ALLOWED_ORIGINS",
    "EMAIL_PROVIDER",
    "FRONTEND_URL",
    "GEMINI_API_KEY",
];
function loadEnv() {
    const missing = [];
    const values = {};
    for (const key of REQUIRED_VARS) {
        const value = process.env[key];
        if (value === undefined || value.trim() === "") {
            missing.push(key);
        }
        else {
            values[key] = value;
        }
    }
    if (missing.length > 0) {
        throw new Error(`Missing required environment variable(s): ${missing.join(", ")}. Check backend/.env against backend/.env.example.`);
    }
    return values;
}
const raw = loadEnv();
const SMTP_VARS = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASSWORD"];
function loadSmtpConfig() {
    if (raw.EMAIL_PROVIDER !== "smtp") {
        return undefined;
    }
    const missing = SMTP_VARS.filter((key) => !process.env[key] || process.env[key].trim() === "");
    if (missing.length > 0) {
        throw new Error(`EMAIL_PROVIDER=smtp requires the following environment variable(s), which are missing: ${missing.join(", ")}. Check backend/.env against backend/.env.example.`);
    }
    return {
        host: process.env.SMTP_HOST,
        port: Number.parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE.toLowerCase() === "true",
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
    };
}
exports.env = {
    nodeEnv: raw.NODE_ENV,
    isProduction: raw.NODE_ENV === "production",
    port: Number.parseInt(raw.PORT, 10),
    db: {
        host: raw.DB_HOST,
        port: Number.parseInt(raw.DB_PORT, 10),
        username: raw.DB_USERNAME,
        password: raw.DB_PASSWORD,
        database: raw.DB_DATABASE,
    },
    jwt: {
        secret: raw.JWT_SECRET,
        accessExpiresIn: raw.JWT_ACCESS_EXPIRES_IN,
    },
    session: {
        cookieName: raw.SESSION_COOKIE_NAME,
        expiresInDays: Number.parseInt(raw.SESSION_TOKEN_EXPIRES_IN_DAYS, 10),
    },
    corsAllowedOrigins: raw.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
    emailProvider: raw.EMAIL_PROVIDER,
    smtp: loadSmtpConfig(),
    frontendUrl: raw.FRONTEND_URL,
    gemini: {
        apiKey: raw.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL?.trim() || "gemini-flash-lite-latest",
        embeddingModel: process.env.GEMINI_EMBEDDING_MODEL?.trim() || "models/gemini-embedding-001",
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY?.trim() || "",
        model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b",
    },
    mistral: {
        apiKey: process.env.MISTRAL_API_KEY?.trim() || "",
        model: process.env.MISTRAL_MODEL?.trim() || "mistral-small-latest",
    },
    openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY?.trim() || "",
        model: process.env.OPENROUTER_MODEL?.trim() || "deepseek/deepseek-v4-flash-0731:free",
    },
    ai: {
        maxRetries: Number.parseInt(process.env.AI_MAX_RETRIES?.trim() || "2", 10),
        requestTimeoutMs: Number.parseInt(process.env.AI_REQUEST_TIMEOUT?.trim() || "30000", 10),
        retryBaseDelayMs: Number.parseInt(process.env.AI_RETRY_BASE_DELAY?.trim() || "500", 10),
    },
};
//# sourceMappingURL=env.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const zod_1 = require("zod");
const AppError_1 = require("../utils/AppError");
const apiResponse_1 = require("../utils/apiResponse");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorMiddleware(err, _req, res, _next) {
    if (err instanceof AppError_1.AppError) {
        (0, apiResponse_1.sendError)(res, err.statusCode, err.message, err.code);
        return;
    }
    if (err instanceof zod_1.ZodError) {
        const firstIssue = err.issues[0];
        (0, apiResponse_1.sendError)(res, 400, firstIssue ? firstIssue.message : "Invalid request", "VALIDATION_ERROR");
        return;
    }
    // Never leak stack traces, ORM errors, or SQL details to the client.
    console.error("[Unhandled error]", err);
    (0, apiResponse_1.sendError)(res, 500, "Something went wrong. Please try again later.", "INTERNAL_ERROR");
}
//# sourceMappingURL=error.middleware.js.map
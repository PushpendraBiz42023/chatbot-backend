"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, statusCode, message, data) {
    const body = { success: true, message };
    if (data !== undefined) {
        body.data = data;
    }
    return res.status(statusCode).json(body);
}
function sendError(res, statusCode, message, code) {
    const body = { success: false, message, code };
    return res.status(statusCode).json(body);
}
//# sourceMappingURL=apiResponse.js.map
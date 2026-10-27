"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = notFoundMiddleware;
const apiResponse_1 = require("../utils/apiResponse");
function notFoundMiddleware(_req, res) {
    (0, apiResponse_1.sendError)(res, 404, "Resource not found", "NOT_FOUND");
}
//# sourceMappingURL=notFound.middleware.js.map
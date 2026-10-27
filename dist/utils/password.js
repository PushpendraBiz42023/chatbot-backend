"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const constants_1 = require("../config/constants");
async function hashPassword(plainPassword) {
    return bcrypt_1.default.hash(plainPassword, constants_1.BCRYPT_COST_FACTOR);
}
async function comparePassword(plainPassword, passwordHash) {
    return bcrypt_1.default.compare(plainPassword, passwordHash);
}
//# sourceMappingURL=password.js.map
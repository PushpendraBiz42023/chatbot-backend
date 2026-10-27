"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpVerification = exports.OtpPurpose = void 0;
const typeorm_1 = require("typeorm");
var OtpPurpose;
(function (OtpPurpose) {
    OtpPurpose["SIGNUP_VERIFICATION"] = "SIGNUP_VERIFICATION";
    OtpPurpose["PASSWORD_RESET"] = "PASSWORD_RESET";
})(OtpPurpose || (exports.OtpPurpose = OtpPurpose = {}));
let OtpVerification = class OtpVerification {
};
exports.OtpVerification = OtpVerification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], OtpVerification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], OtpVerification.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: OtpPurpose }),
    __metadata("design:type", String)
], OtpVerification.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 64, name: "code_hash" }),
    __metadata("design:type", String)
], OtpVerification.prototype, "codeHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", name: "expires_at" }),
    __metadata("design:type", Date)
], OtpVerification.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], OtpVerification.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 5, name: "max_attempts" }),
    __metadata("design:type", Number)
], OtpVerification.prototype, "maxAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", name: "consumed_at", nullable: true }),
    __metadata("design:type", Object)
], OtpVerification.prototype, "consumedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], OtpVerification.prototype, "createdAt", void 0);
exports.OtpVerification = OtpVerification = __decorate([
    (0, typeorm_1.Entity)({ name: "otp_verifications" }),
    (0, typeorm_1.Index)(["email", "purpose"])
], OtpVerification);
//# sourceMappingURL=otp.entity.js.map
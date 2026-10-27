import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/apiResponse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.code);
    return;
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    sendError(res, 400, firstIssue ? firstIssue.message : "Invalid request", "VALIDATION_ERROR");
    return;
  }

  // Never leak stack traces, ORM errors, or SQL details to the client.
  console.error("[Unhandled error]", err);
  sendError(res, 500, "Something went wrong. Please try again later.", "INTERNAL_ERROR");
}

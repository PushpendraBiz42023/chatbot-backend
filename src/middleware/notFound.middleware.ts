import { Request, Response } from "express";
import { sendError } from "../utils/apiResponse";

export function notFoundMiddleware(_req: Request, res: Response): void {
  sendError(res, 404, "Resource not found", "NOT_FOUND");
}

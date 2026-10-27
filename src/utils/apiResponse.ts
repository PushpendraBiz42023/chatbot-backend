import { Response } from "express";

export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  code: string;
}

export function sendSuccess<T>(res: Response, statusCode: number, message: string, data?: T): Response {
  const body: ApiSuccessBody<T> = { success: true, message };
  if (data !== undefined) {
    body.data = data;
  }
  return res.status(statusCode).json(body);
}

export function sendError(res: Response, statusCode: number, message: string, code: string): Response {
  const body: ApiErrorBody = { success: false, message, code };
  return res.status(statusCode).json(body);
}

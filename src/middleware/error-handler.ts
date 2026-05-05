import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";
import { buildRequestDebugInfo, sanitizeForLog } from "../utils/logging";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ApiError) {
    console.error("API error:", {
      message: error.message,
      statusCode: error.statusCode,
      details: sanitizeForLog(error.details ?? null),
      request: buildRequestDebugInfo(_req),
    });

    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null,
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    console.error("Mongoose validation error:", {
      message: error.message,
      request: buildRequestDebugInfo(_req),
      details: sanitizeForLog(error.errors),
    });

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Database validation failed",
      details: error.errors,
    });
  }

  if ("code" in error && error.code === 11000) {
    console.error("Duplicate key error:", {
      request: buildRequestDebugInfo(_req),
      details: sanitizeForLog(error),
    });

    return res.status(StatusCodes.CONFLICT).json({
      message: "A unique field already exists",
      details: error,
    });
  }

  console.error("Unhandled server error:", {
    request: buildRequestDebugInfo(_req),
    name: error.name,
    message: error.message,
    stack: error.stack ?? null,
  });

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: env.NODE_ENV === "production" ? "Internal server error" : error.message,
    details:
      env.NODE_ENV === "production"
        ? undefined
        : {
            name: error.name,
          },
  });
};

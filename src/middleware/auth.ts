import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/api-error";
import { verifyToken } from "../utils/jwt";
import { buildRequestDebugInfo } from "../utils/logging";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.warn("[auth] Missing bearer token", {
      ...buildRequestDebugInfo(req),
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationScheme: authHeader?.split(" ")[0] ?? null,
    });

    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Missing bearer token"));
  }

  try {
    const payload = verifyToken(token, "access");
    req.auth = payload;

    console.info("[auth] Access token verified", {
      method: req.method,
      path: req.originalUrl,
      subject: payload.sub,
      email: payload.email ?? null,
    });

    return next();
  } catch (error) {
    console.warn("[auth] Invalid or expired access token", {
      ...buildRequestDebugInfo(req),
      reason: error instanceof Error ? error.message : "Unknown token error",
    });

    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired access token"));
  }
};

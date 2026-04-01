import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/api-error";
import { verifyToken } from "../utils/jwt";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Missing bearer token"));
  }

  try {
    const payload = verifyToken(token, "access");
    req.auth = payload;
    return next();
  } catch {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired access token"));
  }
};

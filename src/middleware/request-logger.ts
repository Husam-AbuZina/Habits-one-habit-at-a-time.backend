import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { buildRequestDebugInfo } from "../utils/logging";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const startedAt = process.hrtime.bigint();
  let closedEarly = true;

  console.info("[http] Request started", {
    requestId,
    ...buildRequestDebugInfo(req),
  });

  res.on("finish", () => {
    closedEarly = false;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    console.info("[http] Request completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userId: req.auth?.sub ?? null,
      contentLength: res.getHeader("content-length") ?? null,
    });
  });

  res.on("close", () => {
    if (!closedEarly) {
      return;
    }

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    console.warn("[http] Request closed before response finished", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
};

import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/api-error";

const replaceObjectContents = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
) => {
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, source);
};

export const validate =
  (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(new ApiError(400, "Validation failed", result.error.flatten()));
    }

    const parsed = result.data as {
      body?: Request["body"];
      query?: Request["query"];
      params?: Request["params"];
    };

    req.body = parsed.body ?? req.body;

    if (parsed.query) {
      replaceObjectContents(
        req.query as Record<string, unknown>,
        parsed.query as Record<string, unknown>,
      );
    }

    if (parsed.params) {
      replaceObjectContents(
        req.params as Record<string, unknown>,
        parsed.params as Record<string, unknown>,
      );
    }

    return next();
  };

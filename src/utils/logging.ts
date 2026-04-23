import type { Request } from "express";

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|secret|password|private.?key|credential|nonce)/i;
const MAX_STRING_LENGTH = 240;
const MAX_ARRAY_ITEMS = 10;
const MAX_OBJECT_KEYS = 30;
const MAX_DEPTH = 4;

const redactValue = (value: unknown) => {
  if (typeof value !== "string") {
    return "[redacted]";
  }

  if (value.length <= 12) {
    return "[redacted]";
  }

  return `${value.slice(0, 4)}...[${value.length} chars]`;
};

export const sanitizeForLog = (
  value: unknown,
  keyPath: string[] = [],
  depth = 0,
): unknown => {
  const currentKey = keyPath[keyPath.length - 1] ?? "";

  if (SENSITIVE_KEY_PATTERN.test(currentKey)) {
    return value == null ? value : redactValue(value);
  }

  if (value == null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.length <= MAX_STRING_LENGTH) {
      return value;
    }

    return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated ${value.length - MAX_STRING_LENGTH} chars]`;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) {
      return `[array(${value.length})]`;
    }

    const sanitizedItems = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item, index) => sanitizeForLog(item, [...keyPath, String(index)], depth + 1));

    if (value.length > MAX_ARRAY_ITEMS) {
      sanitizedItems.push(`[+${value.length - MAX_ARRAY_ITEMS} more items]`);
    }

    return sanitizedItems;
  }

  if (typeof value === "object") {
    if (depth >= MAX_DEPTH) {
      return "[object]";
    }

    const input = value as Record<string, unknown>;
    const entries = Object.entries(input);
    const sanitizedEntries = entries
      .slice(0, MAX_OBJECT_KEYS)
      .map(([key, nestedValue]) => [key, sanitizeForLog(nestedValue, [...keyPath, key], depth + 1)]);

    const result = Object.fromEntries(sanitizedEntries);

    if (entries.length > MAX_OBJECT_KEYS) {
      result.__truncated__ = `[+${entries.length - MAX_OBJECT_KEYS} more keys]`;
    }

    return result;
  }

  return String(value);
};

export const extractMongoTarget = (mongoUri: string) => {
  const credentialMatch = mongoUri.match(/@([^/?]+)/);
  if (credentialMatch?.[1]) {
    return credentialMatch[1];
  }

  const directMatch = mongoUri.match(/^mongodb(?:\+srv)?:\/\/([^/?]+)/);
  return directMatch?.[1] ?? null;
};

export const buildRequestDebugInfo = (req: Request) => ({
  method: req.method,
  path: req.originalUrl,
  params: sanitizeForLog(req.params),
  query: sanitizeForLog(req.query),
  body: sanitizeForLog(req.body),
  headers: sanitizeForLog({
    host: req.get("host") ?? null,
    origin: req.get("origin") ?? null,
    referer: req.get("referer") ?? null,
    "user-agent": req.get("user-agent") ?? null,
    authorization: req.get("authorization") ?? null,
    "content-type": req.get("content-type") ?? null,
    "x-forwarded-for": req.get("x-forwarded-for") ?? null,
  }),
  ip: req.ip ?? null,
});

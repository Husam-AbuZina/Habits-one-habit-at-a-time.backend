import jwt from "jsonwebtoken";
import ms, { type StringValue } from "ms";
import { env } from "../config/env";
import { RefreshTokenModel } from "../models/refresh-token.model";
import { signToken } from "../utils/jwt";

export const issueAuthTokens = async (
  user: { _id: string; email: string },
  sessionMeta?: { userAgent?: string | null; ipAddress?: string | null },
) => {
  const accessToken = signToken({
    sub: user._id,
    email: user.email,
    tokenType: "access",
  });

  const refreshToken = signToken({
    sub: user._id,
    email: user.email,
    tokenType: "refresh",
  });

  const refreshMs = ms(env.JWT_REFRESH_EXPIRES_IN as StringValue);

  await RefreshTokenModel.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + refreshMs),
    userAgent: sessionMeta?.userAgent ?? null,
    ipAddress: sessionMeta?.ipAddress ?? null,
  });

  const decoded = jwt.decode(accessToken) as { exp?: number } | null;

  return {
    accessToken,
    refreshToken,
    expiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null,
  };
};

import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env";

export type TokenKind = "access" | "refresh";

export interface JwtPayload {
  sub: string;
  email: string;
  tokenType: TokenKind;
}

const getSecret = (tokenType: TokenKind): Secret =>
  tokenType === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;

const getExpiration = (tokenType: TokenKind): SignOptions["expiresIn"] =>
  tokenType === "access"
    ? (env.JWT_ACCESS_EXPIRES_IN as StringValue)
    : (env.JWT_REFRESH_EXPIRES_IN as StringValue);

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, getSecret(payload.tokenType), {
    expiresIn: getExpiration(payload.tokenType),
  });

export const verifyToken = (token: string, tokenType: TokenKind) =>
  jwt.verify(token, getSecret(tokenType)) as JwtPayload;

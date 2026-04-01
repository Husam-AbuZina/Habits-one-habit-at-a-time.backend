import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { RefreshTokenModel } from "../models/refresh-token.model";
import { UserModel } from "../models/user.model";
import { ensureUserSettings } from "../services/settings.service";
import { issueAuthTokens } from "../services/token.service";
import { ApiError } from "../utils/api-error";
import { comparePassword, hashPassword } from "../utils/password";
import { verifyToken } from "../utils/jwt";
import { pickRequestIp } from "../utils/http";

const serializeUser = (user: {
  _id: { toString(): string };
  email: string;
  name?: string | null;
  avatar?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name ?? null,
  avatar: user.avatar ?? null,
  createdAt: user.createdAt?.toISOString() ?? null,
  updatedAt: user.updatedAt?.toISOString() ?? null,
});

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "Email is already registered");
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({
    email,
    passwordHash,
    name: name ?? null,
  });

  await ensureUserSettings(user._id.toString());

  const tokens = await issueAuthTokens(
    { _id: user._id.toString(), email: user.email },
    {
      userAgent: req.get("user-agent"),
      ipAddress: pickRequestIp(req.headers["x-forwarded-for"]) ?? req.ip ?? null,
    },
  );

  return res.status(StatusCodes.CREATED).json({
    user: serializeUser(user),
    tokens,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const isMatch = await comparePassword(password, user.passwordHash);

  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  await ensureUserSettings(user._id.toString());

  const tokens = await issueAuthTokens(
    { _id: user._id.toString(), email: user.email },
    {
      userAgent: req.get("user-agent"),
      ipAddress: pickRequestIp(req.headers["x-forwarded-for"]) ?? req.ip ?? null,
    },
  );

  return res.json({
    user: serializeUser(user),
    tokens,
  });
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.body?.refreshToken as string | undefined;

  if (refreshToken) {
    await RefreshTokenModel.deleteOne({ token: refreshToken });
  } else if (req.auth?.sub) {
    await RefreshTokenModel.deleteMany({ userId: req.auth.sub });
  }

  return res.status(StatusCodes.NO_CONTENT).send();
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  let payload;
  try {
    payload = verifyToken(refreshToken, "refresh");
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const tokenRecord = await RefreshTokenModel.findOne({
    token: refreshToken,
    userId: payload.sub,
  });

  if (!tokenRecord) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token not recognized");
  }

  const user = await UserModel.findById(payload.sub);

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  await RefreshTokenModel.deleteOne({ _id: tokenRecord._id });

  const tokens = await issueAuthTokens(
    { _id: user._id.toString(), email: user.email },
    {
      userAgent: req.get("user-agent"),
      ipAddress: pickRequestIp(req.headers["x-forwarded-for"]) ?? req.ip ?? null,
    },
  );

  return res.json({
    user: serializeUser(user),
    tokens,
  });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.auth?.sub);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return res.json({
    user: serializeUser(user),
  });
};

export const updateMe = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.auth?.sub);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (req.body.email && req.body.email !== user.email) {
    const existing = await UserModel.findOne({ email: req.body.email, _id: { $ne: user._id } });
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, "Email is already in use");
    }
  }

  Object.assign(user, req.body);
  await user.save();

  return res.json({
    user: serializeUser(user),
  });
};

export const deleteMe = async (req: Request, res: Response) => {
  const userId = req.auth?.sub;

  await Promise.all([
    UserModel.deleteOne({ _id: userId }),
    RefreshTokenModel.deleteMany({ userId }),
  ]);

  return res.status(StatusCodes.NO_CONTENT).send();
};

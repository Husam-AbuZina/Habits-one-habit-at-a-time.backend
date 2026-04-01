import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UserModel } from "../models/user.model";
import { getHabitCounters } from "../services/habit.service";
import { ensureUserSettings } from "../services/settings.service";
import { ApiError } from "../utils/api-error";

export const getBootstrap = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.auth?.sub);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const settings = await ensureUserSettings(user._id.toString());
  const counters = await getHabitCounters(user._id.toString());

  return res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name ?? null,
      avatar: user.avatar ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    settings,
    counters,
  });
};

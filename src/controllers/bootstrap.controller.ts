import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HabitModel } from "../models/habit.model";
import { UserModel } from "../models/user.model";
import { getHabitCounters } from "../services/habit.service";
import { ensureUserSettings } from "../services/settings.service";
import { ApiError } from "../utils/api-error";
import { serializeHabit } from "../utils/habit";

export const getBootstrap = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.auth?.sub);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const [settings, counters, activeHabits, archivedHabits] = await Promise.all([
    ensureUserSettings(user._id.toString()),
    getHabitCounters(user._id.toString()),
    HabitModel.find({ userId: user._id, isArchived: false }).sort({ order: 1, createdAt: 1 }),
    HabitModel.find({ userId: user._id, isArchived: true }).sort({ archivedAt: -1, createdAt: 1 }),
  ]);

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
    activeHabits: activeHabits.map((habit) => serializeHabit(habit)),
    archivedHabits: archivedHabits.map((habit) => serializeHabit(habit)),
    todaySummary: counters,
    recentHistorySnapshot: activeHabits.slice(0, 10).map((habit) => ({
      habitId: String(habit._id),
      history: habit.history.entries.slice(-7),
    })),
    counters,
  });
};

import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HabitModel } from "../models/habit.model";
import { UserModel } from "../models/user.model";
import { getHabitCounters } from "../services/habit.service";
import { ensureUserSettings } from "../services/settings.service";
import { ApiError } from "../utils/api-error";
import { serializeHabit } from "../utils/habit";

const serializeSettings = (settings: any) => ({
  appearanceMode: settings.appearanceMode,
  appIconMode: settings.appIconMode,
  language: settings.language,
  soundsEnabled: settings.soundsEnabled,
  completionSoundId: settings.completionSoundId,
  failureSoundId: settings.failureSoundId,
  notificationSoundId: settings.notificationSoundId,
  weekStartsOn: settings.weekStartsOn,
  sortCompletedMode: settings.sortCompletedMode,
  sortSkippedMode: settings.sortSkippedMode,
  appBadgeEnabled: settings.appBadgeEnabled,
  includeDailyInBadge: settings.includeDailyInBadge,
  includeWeeklyInBadge: settings.includeWeeklyInBadge,
  includeMonthlyInBadge: settings.includeMonthlyInBadge,
  widgetActionMode: settings.widgetActionMode,
  distanceUnit: settings.distanceUnit,
  volumeUnit: settings.volumeUnit,
  startOfDay: settings.startOfDay,
  vacationModeEnabled: settings.vacationModeEnabled,
  vacationModeScope: settings.vacationModeScope,
  vacationModeHabitIds: (settings.vacationModeHabitIds ?? []).map(String),
});

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
    settings: serializeSettings(settings),
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

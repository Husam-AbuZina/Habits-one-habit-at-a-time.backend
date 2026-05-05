import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { SettingsModel } from "../models/settings.model";
import { ensureUserSettings } from "../services/settings.service";
import { getHabitCounters } from "../services/habit.service";

export const serializeSettings = (settings: any) => ({
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

const updateSettings = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);
  Object.assign(settings, req.body);
  await settings.save();

  return res.status(StatusCodes.OK).json({
    settings: serializeSettings(settings),
  });
};

export const getSettings = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);

  return res.json({
    settings: serializeSettings(settings),
  });
};

export const patchSettings = updateSettings;
export const patchAppearance = updateSettings;
export const patchSounds = updateSettings;
export const patchVacationMode = updateSettings;
export const patchWeekStart = updateSettings;
export const patchCompletionSound = updateSettings;
export const patchFailureSound = updateSettings;
export const patchNotificationSound = updateSettings;

export const getSummaryCounters = async (req: Request, res: Response) => {
  const settings = await SettingsModel.findOne({ userId: req.auth!.sub }).lean();
  const counters = await getHabitCounters(req.auth!.sub);

  return res.json({
    summary: {
      ...counters,
      weekStartsOn: settings?.weekStartsOn ?? "monday",
    },
  });
};

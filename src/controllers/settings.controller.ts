import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { SettingsModel } from "../models/settings.model";
import { ensureUserSettings } from "../services/settings.service";

const updateSettings = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);
  Object.assign(settings, req.body);
  await settings.save();

  return res.status(StatusCodes.OK).json({
    settings,
  });
};

export const getSettings = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);

  return res.json({
    settings,
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

  return res.json({
    summary: {
      activeHabitsCount: 0,
      archivedHabitsCount: 0,
      todayCompletedCount: 0,
      todaySkippedCount: 0,
      weekStartsOn: settings?.weekStartsOn ?? "monday",
    },
  });
};

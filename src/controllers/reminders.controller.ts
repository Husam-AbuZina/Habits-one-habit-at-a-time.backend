import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ReminderModel } from "../models/reminder.model";
import { SettingsModel } from "../models/settings.model";
import { ensureUserSettings } from "../services/settings.service";

export const listReminders = async (req: Request, res: Response) => {
  const filters: Record<string, unknown> = { userId: req.auth!.sub };
  if (typeof req.query.habitId === "string") filters.habitId = req.query.habitId;
  const reminders = await ReminderModel.find(filters).sort({ createdAt: 1 });
  res.json({ reminders });
};
export const createReminder = async (req: Request, res: Response) => {
  const reminder = await ReminderModel.create({ userId: req.auth!.sub, ...req.body });
  res.status(StatusCodes.CREATED).json({ reminder });
};
export const updateReminder = async (req: Request, res: Response) => {
  const reminder = await ReminderModel.findOneAndUpdate({ _id: String(req.params.reminderId), userId: req.auth!.sub }, { $set: req.body }, { new: true });
  res.json({ reminder });
};
export const deleteReminder = async (req: Request, res: Response) => {
  await ReminderModel.deleteOne({ _id: String(req.params.reminderId), userId: req.auth!.sub });
  res.status(StatusCodes.NO_CONTENT).send();
};
export const testNotification = async (_req: Request, res: Response) => {
  res.json({ delivered: false, queued: true, message: "Test notification accepted for future delivery infrastructure." });
};
export const getNotificationPreferences = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);
  res.json({ preferences: { notificationsEnabled: settings.notificationsEnabled, soundsEnabled: settings.soundsEnabled, notificationSoundId: settings.notificationSoundId, appBadgeEnabled: settings.appBadgeEnabled } });
};
export const patchNotificationPreferences = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);
  Object.assign(settings, req.body);
  await settings.save();
  res.json({ preferences: { notificationsEnabled: settings.notificationsEnabled, soundsEnabled: settings.soundsEnabled, notificationSoundId: settings.notificationSoundId, appBadgeEnabled: settings.appBadgeEnabled } });
};

export const listHabitReminders = async (req: Request, res: Response) => {
  const reminders = await ReminderModel.find({
    userId: req.auth!.sub,
    habitId: String(req.params.habitId),
  }).sort({ createdAt: 1 });
  res.json({ reminders });
};

export const createHabitReminder = async (req: Request, res: Response) => {
  const reminder = await ReminderModel.create({
    userId: req.auth!.sub,
    habitId: String(req.params.habitId),
    ...req.body,
  });
  res.status(StatusCodes.CREATED).json({ reminder });
};

export const updateHabitReminder = updateReminder;
export const deleteHabitReminder = deleteReminder;

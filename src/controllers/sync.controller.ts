import type { Request, Response } from "express";
import { HabitModel } from "../models/habit.model";
import { NoteModel } from "../models/note.model";
import { ReminderModel } from "../models/reminder.model";
import { SettingsModel } from "../models/settings.model";
import { ensureUserSettings } from "../services/settings.service";

export const getSync = async (req: Request, res: Response) => {
  const since = req.query.since ? new Date(String(req.query.since)) : new Date(0);
  const [settings, habits, notes, reminders] = await Promise.all([
    SettingsModel.findOne({ userId: req.auth!.sub, updatedAt: { $gte: since } }),
    HabitModel.find({ userId: req.auth!.sub, updatedAt: { $gte: since } }),
    NoteModel.find({ userId: req.auth!.sub, updatedAt: { $gte: since } }),
    ReminderModel.find({ userId: req.auth!.sub, updatedAt: { $gte: since } }),
  ]);
  res.json({ since, settings, habits, notes, reminders });
};

export const pushSync = async (req: Request, res: Response) => {
  if (req.body.settings) {
    const settings = await ensureUserSettings(req.auth!.sub);
    Object.assign(settings, req.body.settings);
    await settings.save();
  }
  if (Array.isArray(req.body.habits)) {
    for (const habit of req.body.habits) {
      if (habit.id) {
        await HabitModel.updateOne({ _id: habit.id, userId: req.auth!.sub }, { $set: habit });
      }
    }
  }
  if (Array.isArray(req.body.notes)) {
    for (const note of req.body.notes) {
      if (note.id) {
        await NoteModel.updateOne({ _id: note.id, userId: req.auth!.sub }, { $set: note });
      }
    }
  }
  if (Array.isArray(req.body.reminders)) {
    for (const reminder of req.body.reminders) {
      if (reminder.id) {
        await ReminderModel.updateOne({ _id: reminder.id, userId: req.auth!.sub }, { $set: reminder });
      }
    }
  }
  res.json({ accepted: true, syncedAt: new Date().toISOString() });
};

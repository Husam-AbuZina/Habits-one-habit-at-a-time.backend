import type { Request, Response } from "express";
import { HabitModel } from "../models/habit.model";
import { NoteModel } from "../models/note.model";
import { SettingsModel } from "../models/settings.model";

export const exportCsv = async (req: Request, res: Response) => {
  const habits = await HabitModel.find({ userId: req.auth!.sub }).sort({ createdAt: 1 });
  const header = "id,title,intent,goalCount,isArchived,createdAt";
  const rows = habits.map((habit) => [String(habit._id), JSON.stringify(habit.title), habit.intent, habit.goalCount, habit.isArchived, habit.createdAt.toISOString()].join(","));
  res.type("text/csv").send([header, ...rows].join("\n"));
};
export const exportJson = async (req: Request, res: Response) => {
  const [settings, habits, notes] = await Promise.all([
    SettingsModel.findOne({ userId: req.auth!.sub }),
    HabitModel.find({ userId: req.auth!.sub }),
    NoteModel.find({ userId: req.auth!.sub }),
  ]);
  res.json({ settings, habits, notes, exportedAt: new Date().toISOString() });
};
export const importJson = async (req: Request, res: Response) => {
  if (req.body.settings) {
    await SettingsModel.updateOne({ userId: req.auth!.sub }, { $set: req.body.settings }, { upsert: true });
  }
  if (Array.isArray(req.body.habits)) {
    for (const habit of req.body.habits) {
      await HabitModel.create({ userId: req.auth!.sub, ...habit });
    }
  }
  if (Array.isArray(req.body.notes)) {
    for (const note of req.body.notes) {
      await NoteModel.create({ userId: req.auth!.sub, ...note });
    }
  }
  res.json({ imported: true });
};
export const createBackup = exportJson;
export const restoreBackup = importJson;

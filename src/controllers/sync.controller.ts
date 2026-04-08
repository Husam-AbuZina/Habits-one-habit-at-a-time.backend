import type { Request, Response } from "express";
import { HabitModel } from "../models/habit.model";
import { ensureUserSettings } from "../services/settings.service";
import { serializeHabit } from "../utils/habit";

export const pullSnapshot = async (req: Request, res: Response) => {
  const [settings, habits] = await Promise.all([
    ensureUserSettings(req.auth!.sub),
    HabitModel.find({ userId: req.auth!.sub }).sort({ isArchived: 1, order: 1, createdAt: 1 }),
  ]);

  res.json({
    pulledAt: new Date().toISOString(),
    snapshot: {
      settings,
      habits: habits.map((habit) => serializeHabit(habit)),
    },
  });
};

export const pushSnapshot = async (req: Request, res: Response) => {
  if (req.body.settings) {
    const settings = await ensureUserSettings(req.auth!.sub);
    Object.assign(settings, req.body.settings);
    await settings.save();
  }

  if (Array.isArray(req.body.habits)) {
    for (const habit of req.body.habits) {
      if (habit.id) {
        await HabitModel.updateOne(
          { _id: habit.id, userId: req.auth!.sub },
          { $set: habit },
        );
      }
    }
  }

  res.json({
    applied: true,
    lastWriteWins: true,
    pushedAt: new Date().toISOString(),
  });
};

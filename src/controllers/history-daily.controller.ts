import type { Request, Response } from "express";
import { HabitModel } from "../models/habit.model";
import { toDateOnlyString } from "../utils/date";

export const getHistoryDaily = async (req: Request, res: Response) => {
  const from = typeof req.query.from === "string" ? toDateOnlyString(req.query.from) : null;
  const to = typeof req.query.to === "string" ? toDateOnlyString(req.query.to) : null;
  const habits = await HabitModel.find({ userId: req.auth!.sub }).sort({ order: 1, createdAt: 1 });
  const daily = habits.flatMap((habit) =>
    habit.history.entries
      .filter((entry) => (!from || entry.date >= from) && (!to || entry.date <= to))
      .map((entry) => ({
        habitId: String(habit._id),
        title: habit.title,
        intent: habit.intent,
        goalCount: habit.goalCount,
        ...entry.toObject?.() ?? entry,
      })),
  );
  res.json({ from, to, daily });
};

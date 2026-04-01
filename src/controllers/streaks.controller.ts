import type { Request, Response } from "express";
import { HabitModel } from "../models/habit.model";
import { countCompletionStatus } from "../utils/habit";

export const getHabitStreaks = async (req: Request, res: Response) => {
  const habit = await HabitModel.findOne({ _id: String(req.params.habitId), userId: req.auth!.sub });
  if (!habit) return res.status(404).json({ message: "Habit not found" });
  const dates = [...habit.history.entries.map((entry) => entry.date)].sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;
  for (const date of dates) {
    const completed = countCompletionStatus(habit, date).isCompleted;
    run = completed ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }
  for (let i = dates.length - 1; i >= 0; i -= 1) {
    if (countCompletionStatus(habit, dates[i]!).isCompleted) currentStreak += 1;
    else break;
  }
  res.json({
    currentStreak,
    longestStreak,
    completedDaysCount: dates.filter((date) => countCompletionStatus(habit, date).isCompleted).length,
  });
};

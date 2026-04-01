import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HabitModel } from "../models/habit.model";
import { ApiError } from "../utils/api-error";
import { toDateOnlyString } from "../utils/date";
import { serializeHabit } from "../utils/habit";
import { serializeHistoryEntry, upsertHistoryEntry } from "../utils/history";

const getOwnedHabit = async (userId: string, habitId: string) => {
  const habit = await HabitModel.findOne({ _id: habitId, userId });
  if (!habit) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Habit not found");
  }
  return habit;
};

const evaluateStatus = (
  habit: { intent: "build" | "break"; goalCount: number },
  entry: { completedCount: number; isSkipped: boolean; status: "undone" | "partial" | "done" },
) => ({
  status: entry.status,
  isSkipped: entry.isSkipped,
  isCompleted:
    !entry.isSkipped &&
    (habit.intent === "build" ? entry.completedCount >= habit.goalCount : entry.completedCount === 0),
  isFailed:
    !entry.isSkipped && habit.intent === "break" && entry.completedCount > habit.goalCount,
  completedCount: entry.completedCount,
});

export const getDayStatus = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const dateKey = toDateOnlyString(String(req.params.date));
  const entry =
    habit.history.entries.find((item) => item.date === dateKey) ?? {
      date: dateKey,
      completedCount: 0,
      status: habit.intent === "break" ? "done" : "undone",
      isSkipped: false,
    };

  res.json({
    habit: {
      id: habit._id.toString(),
      intent: habit.intent,
      goalCount: habit.goalCount,
      selectedDate: dateKey,
    },
    evaluation: evaluateStatus(habit, entry),
  });
};

export const recalculateDayStatus = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const dateKey = toDateOnlyString(String(req.params.date));
  const current =
    habit.history.entries.find((item) => item.date === dateKey) ?? {
      date: dateKey,
      completedCount: 0,
      status: "undone" as const,
      isSkipped: false,
    };
  const entry = upsertHistoryEntry(
    habit,
    dateKey,
    {
      completedCount: current.completedCount,
      isSkipped: current.isSkipped,
    },
    true,
  );
  await habit.save();

  res.json({
    habit: serializeHabit(habit, dateKey),
    entry: serializeHistoryEntry(entry, habit),
  });
};

export const recalculateHabit = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));

  for (const entry of habit.history.entries) {
    upsertHistoryEntry(
      habit,
      entry.date,
      {
        completedCount: entry.completedCount,
        isSkipped: entry.isSkipped,
      },
      true,
    );
  }

  await habit.save();

  res.json({
    habit: serializeHabit(habit),
    repairedEntries: habit.history.entries.length,
  });
};

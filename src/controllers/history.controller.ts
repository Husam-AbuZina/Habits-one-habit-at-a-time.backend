import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HabitModel } from "../models/habit.model";
import { ApiError } from "../utils/api-error";
import { toDateOnlyString } from "../utils/date";
import { serializeHabit } from "../utils/habit";
import {
  serializeHistoryEntry,
  sortHistoryEntries,
  upsertHistoryEntry,
} from "../utils/history";

const getOwnedHabit = async (userId: string, habitId: string) => {
  const habit = await HabitModel.findOne({ _id: habitId, userId });

  if (!habit) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Habit not found");
  }

  return habit;
};

export const listHistory = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const from = typeof req.query.from === "string" ? toDateOnlyString(req.query.from) : null;
  const to = typeof req.query.to === "string" ? toDateOnlyString(req.query.to) : null;

  const entries = sortHistoryEntries(habit.history.entries).filter((entry) => {
    if (from && entry.date < from) {
      return false;
    }

    if (to && entry.date > to) {
      return false;
    }

    return true;
  });

  res.json({
    habit: {
      id: habit._id.toString(),
      title: habit.title,
      intent: habit.intent,
      goalCount: habit.goalCount,
    },
    history: {
      createdAt: habit.history.createdAt.toISOString(),
      entries: entries.map((entry) => serializeHistoryEntry(entry, habit)),
    },
  });
};

export const getHistoryDay = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const dateKey = toDateOnlyString(String(req.params.date));
  const entry = habit.history.entries.find((item) => item.date === dateKey) ?? null;

  res.json({
    habit: serializeHabit(habit, dateKey),
    entry: serializeHistoryEntry(entry, habit),
  });
};

export const putHistoryDay = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const entry = upsertHistoryEntry(habit, String(req.params.date), req.body, true);
  await habit.save();

  res.json({
    habit: serializeHabit(habit, entry.date),
    entry: serializeHistoryEntry(entry, habit),
  });
};

export const patchHistoryDay = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const entry = upsertHistoryEntry(habit, String(req.params.date), req.body, false);
  await habit.save();

  res.json({
    habit: serializeHabit(habit, entry.date),
    entry: serializeHistoryEntry(entry, habit),
  });
};

export const deleteHistoryDay = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const dateKey = toDateOnlyString(String(req.params.date));
  const existingEntry = habit.history.entries.find((entry) => entry.date === dateKey);

  if (!existingEntry) {
    throw new ApiError(StatusCodes.NOT_FOUND, "History entry not found");
  }

  existingEntry.deleteOne();

  if (dateKey === toDateOnlyString(new Date())) {
    habit.skippedAt = null;
  }

  await habit.save();

  res.status(StatusCodes.NO_CONTENT).send();
};

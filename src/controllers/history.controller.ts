import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HabitModel } from "../models/habit.model";
import { ApiError } from "../utils/api-error";
import { toDateOnlyString } from "../utils/date";
import { deriveHistoryStatus, serializeHabit } from "../utils/habit";

type HistoryEntry = {
  date: string;
  completedCount: number;
  status: "undone" | "partial" | "done";
  isSkipped: boolean;
};

const getOwnedHabit = async (userId: string, habitId: string) => {
  const habit = await HabitModel.findOne({ _id: habitId, userId });

  if (!habit) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Habit not found");
  }

  return habit;
};

const sortEntries = (entries: HistoryEntry[]) =>
  [...entries].sort((a, b) => a.date.localeCompare(b.date));

const serializeEntry = (entry: HistoryEntry | null, habit: { intent: "build" | "break"; goalCount: number }) =>
  entry
    ? {
        date: entry.date,
        completedCount: entry.completedCount,
        status: entry.status,
        isSkipped: entry.isSkipped,
        isCompleted:
          !entry.isSkipped &&
          (habit.intent === "build"
            ? entry.completedCount >= habit.goalCount
            : entry.completedCount === 0),
        isFailed:
          !entry.isSkipped &&
          habit.intent === "break" &&
          entry.completedCount > habit.goalCount,
      }
    : null;

const upsertHistoryEntry = (
  habit: Awaited<ReturnType<typeof getOwnedHabit>>,
  date: string,
  patch: Partial<HistoryEntry>,
  replace: boolean,
) => {
  const dateKey = toDateOnlyString(date);
  const existingIndex = habit.history.entries.findIndex((entry) => entry.date === dateKey);

  const base: HistoryEntry =
    existingIndex >= 0
      ? {
          date: habit.history.entries[existingIndex]!.date,
          completedCount: habit.history.entries[existingIndex]!.completedCount,
          status: habit.history.entries[existingIndex]!.status,
          isSkipped: habit.history.entries[existingIndex]!.isSkipped,
        }
      : {
          date: dateKey,
          completedCount: 0,
          status: "undone",
          isSkipped: false,
        };

  const next = replace
    ? {
        date: dateKey,
        completedCount: patch.completedCount ?? 0,
        isSkipped: patch.isSkipped ?? false,
        status:
          patch.status ??
          deriveHistoryStatus({
            intent: habit.intent,
            goalCount: habit.goalCount,
            completedCount: patch.completedCount ?? 0,
            isSkipped: patch.isSkipped ?? false,
          }),
      }
    : {
        ...base,
        ...patch,
      };

  next.status = deriveHistoryStatus({
    intent: habit.intent,
    goalCount: habit.goalCount,
    completedCount: next.completedCount,
    isSkipped: next.isSkipped,
  });

  if (existingIndex >= 0) {
    habit.history.entries[existingIndex]!.date = next.date;
    habit.history.entries[existingIndex]!.completedCount = next.completedCount;
    habit.history.entries[existingIndex]!.status = next.status;
    habit.history.entries[existingIndex]!.isSkipped = next.isSkipped;
  } else {
    habit.history.entries.push(next);
  }

  habit.skippedAt = next.isSkipped && dateKey === toDateOnlyString(new Date()) ? new Date(dateKey) : habit.skippedAt;

  return next;
};

export const listHistory = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const from = typeof req.query.from === "string" ? toDateOnlyString(req.query.from) : null;
  const to = typeof req.query.to === "string" ? toDateOnlyString(req.query.to) : null;

  const entries = sortEntries(habit.history.entries).filter((entry) => {
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
      entries: entries.map((entry) => serializeEntry(entry, habit)),
    },
  });
};

export const getHistoryDay = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const dateKey = toDateOnlyString(String(req.params.date));
  const entry = habit.history.entries.find((item) => item.date === dateKey) ?? null;

  res.json({
    habit: serializeHabit(habit, dateKey),
    entry: serializeEntry(entry, habit),
  });
};

export const putHistoryDay = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const entry = upsertHistoryEntry(habit, String(req.params.date), req.body, true);
  await habit.save();

  res.json({
    habit: serializeHabit(habit, entry.date),
    entry: serializeEntry(entry, habit),
  });
};

export const patchHistoryDay = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const entry = upsertHistoryEntry(habit, String(req.params.date), req.body, false);
  await habit.save();

  res.json({
    habit: serializeHabit(habit, entry.date),
    entry: serializeEntry(entry, habit),
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

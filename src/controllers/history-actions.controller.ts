import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HabitModel } from "../models/habit.model";
import { toDateOnlyString } from "../utils/date";
import { serializeHabit } from "../utils/habit";
import { serializeHistoryEntry, upsertHistoryEntry } from "../utils/history";
import { ApiError } from "../utils/api-error";

const getOwnedHabit = async (userId: string, habitId: string) => {
  const habit = await HabitModel.findOne({ _id: habitId, userId });
  if (!habit) throw new ApiError(StatusCodes.NOT_FOUND, "Habit not found");
  return habit;
};

const getDayEntry = (habit: any, date: string) => {
  const dateKey = toDateOnlyString(date);
  return (
    habit.history.entries.find((entry: { date: string }) => entry.date === dateKey) ?? {
      date: dateKey,
      completedCount: 0,
      status: "undone",
      isSkipped: false,
    }
  );
};

const clampBuildCount = (habit: any, nextCount: number) => {
  if (habit.intent === "build" && habit.allowsOverflow === false) {
    return Math.min(nextCount, habit.goalCount);
  }

  return Math.max(0, nextCount);
};

const respond = async (req: Request, res: Response, completedCount: number, isSkipped = false) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const entry = upsertHistoryEntry(habit, date, { completedCount, isSkipped }, false);
  await habit.save();
  res.json({ habit: serializeHabit(habit, toDateOnlyString(date)), entry: serializeHistoryEntry(entry, habit) });
};

export const historyIncrement = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const current = getDayEntry(habit, date).completedCount;
  return respond(req, res, clampBuildCount(habit, current + 1));
};
export const historyDecrement = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const current = getDayEntry(habit, date).completedCount;
  return respond(req, res, clampBuildCount(habit, Math.max(0, current - 1)));
};
export const historyFill = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  return respond(req, res, habit.goalCount);
};
export const historyUndo = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const current = getDayEntry(habit, date).completedCount;
  if (habit.intent === "build" && current > habit.goalCount) {
    return respond(req, res, habit.goalCount);
  }
  return respond(req, res, 0);
};
export const historySkip = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const current = getDayEntry(habit, date).completedCount;
  return respond(req, res, current, true);
};
export const historyUnskip = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const current = getDayEntry(habit, date).completedCount;
  return respond(req, res, current, false);
};
export const historyAddDuration = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const current = getDayEntry(habit, date).completedCount;
  const add = habit.unitType === "minutes" ? Math.max(1, Math.floor(Number(req.body.durationSeconds) / 60)) : Number(req.body.durationSeconds);
  return respond(req, res, current + add);
};

export const postHabitAction = async (req: Request, res: Response) => {
  const { type, date, value } = req.body;
  req.params.date = date;
  if (type === "increment") return historyIncrement(req, res);
  if (type === "decrement") return historyDecrement(req, res);
  if (type === "fill") return historyFill(req, res);
  if (type === "undo") return historyUndo(req, res);
  if (type === "skip") return historySkip(req, res);
  if (type === "unskip") return historyUnskip(req, res);
  return respond(req, res, Number(value ?? 0), false);
};

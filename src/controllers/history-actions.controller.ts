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
  const current = habit.history.entries.find((e) => e.date === toDateOnlyString(date))?.completedCount ?? 0;
  return respond(req, res, current + 1);
};
export const historyDecrement = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const current = habit.history.entries.find((e) => e.date === toDateOnlyString(date))?.completedCount ?? 0;
  return respond(req, res, Math.max(0, current - 1));
};
export const historyFill = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  return respond(req, res, habit.goalCount);
};
export const historyUndo = async (req: Request, res: Response) => respond(req, res, 0);
export const historySkip = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const current = habit.history.entries.find((e) => e.date === toDateOnlyString(date))?.completedCount ?? 0;
  return respond(req, res, current, true);
};
export const historyUnskip = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const current = habit.history.entries.find((e) => e.date === toDateOnlyString(date))?.completedCount ?? 0;
  return respond(req, res, current, false);
};
export const historyAddDuration = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const current = habit.history.entries.find((e) => e.date === toDateOnlyString(date))?.completedCount ?? 0;
  const add = habit.unitType === "minutes" ? Math.max(1, Math.floor(Number(req.body.durationSeconds) / 60)) : Number(req.body.durationSeconds);
  return respond(req, res, current + add);
};

export const postHabitAction = async (req: Request, res: Response) => {
  const { action, date, value } = req.body;
  req.params.date = date;
  if (action === "increment") return historyIncrement(req, res);
  if (action === "decrement") return historyDecrement(req, res);
  if (action === "fill") return historyFill(req, res);
  if (action === "undo") return historyUndo(req, res);
  if (action === "skip") return historySkip(req, res);
  if (action === "unskip") return historyUnskip(req, res);
  return respond(req, res, Number(value ?? 0), false);
};

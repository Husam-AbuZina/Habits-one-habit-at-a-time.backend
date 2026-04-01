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

const applyCountUpdate = async (
  req: Request,
  res: Response,
  updater: (habit: any, currentCount: number) => { completedCount: number; isSkipped?: boolean },
) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = String(req.params.date);
  const before = getDayEntry(habit, date);
  const nextValues = updater(habit, before.completedCount);
  const entry = upsertHistoryEntry(
    habit,
    date,
    {
      completedCount: Math.max(0, nextValues.completedCount),
      isSkipped: nextValues.isSkipped ?? false,
    },
    false,
  );

  await habit.save();

  const transitionedToDone = before.status !== "done" && entry.status === "done";
  const transitionedToFailed =
    habit.intent === "break" &&
    before.completedCount <= habit.goalCount &&
    entry.completedCount > habit.goalCount &&
    !entry.isSkipped;

  res.json({
    habit: serializeHabit(habit, entry.date),
    entry: serializeHistoryEntry(entry, habit),
    transitions: {
      transitionedToDone,
      transitionedToFailed,
    },
  });
};

export const incrementDay = async (req: Request, res: Response) =>
  applyCountUpdate(req, res, (habit, currentCount) => ({
    completedCount: clampBuildCount(habit, currentCount + 1),
    isSkipped: false,
  }));

export const decrementDay = async (req: Request, res: Response) =>
  applyCountUpdate(req, res, (habit, currentCount) => ({
    completedCount: clampBuildCount(habit, Math.max(0, currentCount - 1)),
    isSkipped: false,
  }));

export const addToDay = async (req: Request, res: Response) =>
  applyCountUpdate(req, res, (habit, currentCount) => ({
    completedCount: clampBuildCount(habit, currentCount + Number(req.body.amount)),
    isSkipped: false,
  }));

export const addFiveToDay = async (req: Request, res: Response) =>
  applyCountUpdate(req, res, (habit, currentCount) => ({
    completedCount: clampBuildCount(habit, currentCount + 5),
    isSkipped: false,
  }));

export const resetDay = async (req: Request, res: Response) =>
  applyCountUpdate(req, res, () => ({
    completedCount: 0,
    isSkipped: false,
  }));

export const undoDay = async (req: Request, res: Response) =>
  applyCountUpdate(req, res, (habit, currentCount) => {
    if (habit.intent === "build") {
      if (currentCount > habit.goalCount) {
        return {
          completedCount: habit.goalCount,
          isSkipped: false,
        };
      }

      return {
        completedCount: 0,
        isSkipped: false,
      };
    }

    return {
      completedCount: 0,
      isSkipped: false,
    };
  });

export const skipDay = async (req: Request, res: Response) =>
  applyCountUpdate(req, res, (_habit, currentCount) => ({
    completedCount: currentCount,
    isSkipped: true,
  }));

export const unskipDay = async (req: Request, res: Response) =>
  applyCountUpdate(req, res, (_habit, currentCount) => ({
    completedCount: currentCount,
    isSkipped: false,
  }));

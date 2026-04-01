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

const serializeTimer = (habit: any) => ({
  isRunning: Boolean(habit.timer?.isRunning),
  isPaused: Boolean(habit.timer?.isPaused),
  startedAt: habit.timer?.startedAt?.toISOString() ?? null,
  pausedAt: habit.timer?.pausedAt?.toISOString() ?? null,
  accumulatedSeconds: habit.timer?.accumulatedSeconds ?? 0,
  activeDate: habit.timer?.activeDate ?? null,
});

const consumeElapsedSeconds = (habit: any) => {
  const timer = habit.timer;
  if (!timer?.isRunning || !timer.startedAt) {
    return timer?.accumulatedSeconds ?? 0;
  }

  const startedAtMs = new Date(timer.startedAt).getTime();
  const nowMs = Date.now();
  return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000) + (timer.accumulatedSeconds ?? 0));
};

export const getTimer = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  res.json({
    habitId: habit._id.toString(),
    timer: {
      ...serializeTimer(habit),
      currentElapsedSeconds: consumeElapsedSeconds(habit),
    },
  });
};

export const startTimer = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const dateKey = toDateOnlyString(req.body.date ?? new Date().toISOString());
  const startedAt = req.body.startedAt ? new Date(req.body.startedAt) : new Date();

  habit.timer = {
    isRunning: true,
    isPaused: false,
    startedAt,
    pausedAt: null,
    accumulatedSeconds: 0,
    activeDate: dateKey,
  };
  habit.isTimerRunning = true;
  await habit.save();

  res.status(StatusCodes.CREATED).json({
    habit: serializeHabit(habit, dateKey),
    timer: serializeTimer(habit),
  });
};

export const pauseTimer = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  if (!habit.timer?.isRunning || habit.timer.isPaused) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Timer is not actively running");
  }

  habit.timer.accumulatedSeconds = consumeElapsedSeconds(habit);
  habit.timer.isPaused = true;
  habit.timer.isRunning = false;
  habit.timer.pausedAt = new Date();
  habit.timer.startedAt = null;
  habit.isTimerRunning = false;
  await habit.save();

  res.json({ timer: serializeTimer(habit) });
};

export const resumeTimer = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  if (!habit.timer?.isPaused) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Timer is not paused");
  }

  habit.timer.isPaused = false;
  habit.timer.isRunning = true;
  habit.timer.startedAt = new Date();
  habit.timer.pausedAt = null;
  habit.isTimerRunning = true;
  await habit.save();

  res.json({ timer: serializeTimer(habit) });
};

export const stopTimer = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const dateKey = toDateOnlyString(req.body.date ?? habit.timer?.activeDate ?? new Date().toISOString());
  const seconds =
    typeof req.body.durationSeconds === "number"
      ? Math.max(0, req.body.durationSeconds)
      : consumeElapsedSeconds(habit);

  const dayEntry =
    habit.history.entries.find((entry: { date: string }) => entry.date === dateKey) ?? {
      date: dateKey,
      completedCount: 0,
      status: "undone",
      isSkipped: false,
    };

  const amountToAdd = habit.unitType === "minutes" ? Math.max(1, Math.floor(seconds / 60)) : seconds;
  const entry = upsertHistoryEntry(
    habit,
    dateKey,
    {
      completedCount: Math.max(0, dayEntry.completedCount + amountToAdd),
      isSkipped: false,
    },
    false,
  );

  habit.timer = {
    isRunning: false,
    isPaused: false,
    startedAt: null,
    pausedAt: null,
    accumulatedSeconds: 0,
    activeDate: null,
  };
  habit.isTimerRunning = false;
  await habit.save();

  res.json({
    timer: serializeTimer(habit),
    appliedDurationSeconds: seconds,
    habit: serializeHabit(habit, dateKey),
    entry: serializeHistoryEntry(entry, habit),
  });
};

export const cancelTimer = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const dateKey = toDateOnlyString(req.body.date ?? habit.timer?.activeDate ?? new Date().toISOString());

  habit.timer = {
    isRunning: false,
    isPaused: false,
    startedAt: null,
    pausedAt: null,
    accumulatedSeconds: 0,
    activeDate: null,
  };
  habit.isTimerRunning = false;
  await habit.save();

  res.json({
    timer: serializeTimer(habit),
    habit: serializeHabit(habit, dateKey),
  });
};

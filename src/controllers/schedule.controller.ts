import type { Request, Response } from "express";
import { isScheduleActiveOnDate } from "../utils/schedule";
import { HabitModel } from "../models/habit.model";
import { ApiError } from "../utils/api-error";
import { StatusCodes } from "http-status-codes";

const getOwnedHabit = async (userId: string, habitId: string) => {
  const habit = await HabitModel.findOne({ _id: habitId, userId });

  if (!habit) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Habit not found");
  }

  return habit;
};

export const getSchedule = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  res.json({ schedule: habit.schedule ?? null });
};

export const putSchedule = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  habit.schedule = req.body;
  await habit.save();
  res.json({ schedule: habit.schedule ?? null });
};

export const patchSchedule = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  habit.schedule = {
    ...(typeof habit.schedule === "object" && habit.schedule !== null ? habit.schedule : {}),
    ...req.body,
  };
  await habit.save();
  res.json({ schedule: habit.schedule ?? null });
};

export const deleteSchedule = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  habit.schedule = null;
  await habit.save();
  res.status(StatusCodes.NO_CONTENT).send();
};

export const validateScheduleDate = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  const date = req.body.date as string;

  res.json({
    date,
    isActive: isScheduleActiveOnDate(habit.schedule as Record<string, unknown> | null, date),
    schedule: habit.schedule ?? null,
  });
};

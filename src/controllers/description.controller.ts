import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HabitModel } from "../models/habit.model";
import { ApiError } from "../utils/api-error";

const getOwnedHabit = async (userId: string, habitId: string) => {
  const habit = await HabitModel.findOne({ _id: habitId, userId });
  if (!habit) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Habit not found");
  }
  return habit;
};

export const getDescription = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  res.json({
    habitId: String(habit._id),
    description: habit.description ?? null,
  });
};

export const putDescription = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  habit.description = req.body.text;
  await habit.save();
  res.json({
    habitId: String(habit._id),
    description: habit.description ?? null,
  });
};

export const deleteDescription = async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.auth!.sub, String(req.params.habitId));
  habit.description = null;
  await habit.save();
  res.status(StatusCodes.NO_CONTENT).send();
};

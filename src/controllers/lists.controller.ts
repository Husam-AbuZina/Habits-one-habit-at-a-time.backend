import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HabitModel } from "../models/habit.model";
import { ListModel } from "../models/list.model";
import { ApiError } from "../utils/api-error";

export const listLists = async (req: Request, res: Response) => {
  const lists = await ListModel.find({ userId: req.auth!.sub }).sort({ createdAt: 1 });
  res.json({ lists });
};

export const createList = async (req: Request, res: Response) => {
  const list = await ListModel.create({ userId: req.auth!.sub, ...req.body });
  res.status(StatusCodes.CREATED).json({ list });
};

export const updateList = async (req: Request, res: Response) => {
  const list = await ListModel.findOneAndUpdate(
    { _id: String(req.params.listId), userId: req.auth!.sub },
    { $set: req.body },
    { new: true },
  );
  if (!list) throw new ApiError(StatusCodes.NOT_FOUND, "List not found");
  res.json({ list });
};

export const deleteList = async (req: Request, res: Response) => {
  const listId = String(req.params.listId);
  await ListModel.deleteOne({ _id: listId, userId: req.auth!.sub });
  await HabitModel.updateMany({ userId: req.auth!.sub }, { $pull: { listIds: listId } });
  res.status(StatusCodes.NO_CONTENT).send();
};

export const addHabitToList = async (req: Request, res: Response) => {
  const { habitId, listId } = req.params;
  const [habit, list] = await Promise.all([
    HabitModel.findOne({ _id: habitId, userId: req.auth!.sub }),
    ListModel.findOne({ _id: listId, userId: req.auth!.sub }),
  ]);
  if (!habit || !list) throw new ApiError(StatusCodes.NOT_FOUND, "Habit or list not found");
  if (!habit.listIds.map(String).includes(String(listId))) habit.listIds.push(list._id);
  await habit.save();
  res.json({ habitId: String(habit._id), listId: String(list._id) });
};

export const removeHabitFromList = async (req: Request, res: Response) => {
  const { habitId, listId } = req.params;
  const habit = await HabitModel.findOne({ _id: habitId, userId: req.auth!.sub });
  if (!habit) throw new ApiError(StatusCodes.NOT_FOUND, "Habit not found");
  habit.listIds = habit.listIds.filter((id: any) => String(id) !== String(listId));
  await habit.save();
  res.status(StatusCodes.NO_CONTENT).send();
};

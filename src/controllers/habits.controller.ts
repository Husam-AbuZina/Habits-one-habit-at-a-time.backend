import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HabitModel } from "../models/habit.model";
import { ApiError } from "../utils/api-error";
import { serializeHabit } from "../utils/habit";
import { toDateOnlyString } from "../utils/date";

const getSelectedDate = (req: Request) =>
  typeof req.query.date === "string" ? req.query.date : undefined;

const getOwnedHabit = async (userId: string, habitId: string) => {
  const habit = await HabitModel.findOne({ _id: habitId, userId });

  if (!habit) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Habit not found");
  }

  return habit;
};

export const createHabit = async (req: Request, res: Response) => {
  const nextOrder = await HabitModel.countDocuments({
    userId: req.auth!.sub,
    isArchived: false,
  });

  const createdAt = req.body.createdAt ? new Date(req.body.createdAt) : new Date();

  const habit = await HabitModel.create({
    userId: req.auth!.sub,
    title: req.body.title,
    emoji: req.body.emoji ?? null,
    goalCount: req.body.goalCount,
    previousCompletedCount: req.body.previousCompletedCount ?? 0,
    iconKey: req.body.iconKey ?? null,
    colorValue: req.body.colorValue ?? null,
    schedule: req.body.schedule ?? null,
    notes: req.body.notes ?? [],
    intent: req.body.intent,
    goalFrequency: req.body.goalFrequency ?? "daily",
    repeatMode: req.body.repeatMode ?? "schedule",
    remindMe: req.body.remindMe ?? null,
    unitType: req.body.unitType ?? "count",
    customUnit: req.body.customUnit ?? null,
    allowsOverflow:
      req.body.allowsOverflow ?? (req.body.intent === "build" ? true : false),
    isArchived: req.body.isArchived ?? false,
    archivedAt: req.body.isArchived ? new Date() : null,
    isTimerRunning: req.body.isTimerRunning ?? false,
    skippedAt: req.body.skippedAt ? new Date(req.body.skippedAt) : null,
    order: req.body.isArchived ? 0 : nextOrder,
    history: {
      createdAt,
      entries: [],
    },
    createdAt,
  });

  return res.status(StatusCodes.CREATED).json({
    habit: serializeHabit(habit, getSelectedDate(req)),
  });
};

export const listHabits = async (req: Request, res: Response) => {
  const filters: Record<string, unknown> = {
    userId: req.auth!.sub,
  };

  if (typeof req.query.archived === "boolean") {
    filters.isArchived = req.query.archived;
  } else if (typeof req.query.active === "boolean") {
    filters.isArchived = !req.query.active;
  }

  if (typeof req.query.intent === "string") {
    filters.intent = req.query.intent;
  }

  const habits = await HabitModel.find(filters).sort({ isArchived: 1, order: 1, createdAt: 1 });
  const selectedDate = getSelectedDate(req);

  return res.json({
    habits: habits.map((habit) => serializeHabit(habit, selectedDate)),
    meta: {
      selectedDate: selectedDate ? toDateOnlyString(selectedDate) : toDateOnlyString(new Date()),
      ignoredFilters: typeof req.query.category === "string" ? ["category"] : [],
    },
  });
};

export const getHabit = async (req: Request, res: Response) => {
  const habitId = String(req.params.habitId);
  const habit = await getOwnedHabit(req.auth!.sub, habitId);

  return res.json({
    habit: serializeHabit(habit, getSelectedDate(req)),
  });
};

export const updateHabit = async (req: Request, res: Response) => {
  const habitId = String(req.params.habitId);
  const habit = await getOwnedHabit(req.auth!.sub, habitId);

  const updatableFields = [
    "title",
    "emoji",
    "goalCount",
    "previousCompletedCount",
    "iconKey",
    "colorValue",
    "schedule",
    "notes",
    "intent",
    "goalFrequency",
    "repeatMode",
    "remindMe",
    "unitType",
    "customUnit",
    "allowsOverflow",
    "isArchived",
    "isTimerRunning",
  ] as const;

  for (const field of updatableFields) {
    if (field in req.body) {
      habit.set(field, req.body[field]);
    }
  }

  if ("createdAt" in req.body && req.body.createdAt) {
    habit.history.createdAt = new Date(req.body.createdAt);
  }

  if ("skippedAt" in req.body) {
    habit.skippedAt = req.body.skippedAt ? new Date(req.body.skippedAt) : null;
  }

  if ("isArchived" in req.body) {
    habit.archivedAt = req.body.isArchived ? new Date() : null;
  }

  await habit.save();

  return res.json({
    habit: serializeHabit(habit, getSelectedDate(req)),
  });
};

export const deleteHabit = async (req: Request, res: Response) => {
  const habitId = String(req.params.habitId);
  await getOwnedHabit(req.auth!.sub, habitId);
  await HabitModel.deleteOne({ _id: habitId, userId: req.auth!.sub });

  return res.status(StatusCodes.NO_CONTENT).send();
};

export const archiveHabit = async (req: Request, res: Response) => {
  const habitId = String(req.params.habitId);
  const habit = await getOwnedHabit(req.auth!.sub, habitId);

  habit.isArchived = true;
  habit.archivedAt = new Date();
  await habit.save();

  return res.json({
    habit: serializeHabit(habit, getSelectedDate(req)),
  });
};

export const unarchiveHabit = async (req: Request, res: Response) => {
  const habitId = String(req.params.habitId);
  const habit = await getOwnedHabit(req.auth!.sub, habitId);
  const nextOrder = await HabitModel.countDocuments({
    userId: req.auth!.sub,
    isArchived: false,
  });

  habit.isArchived = false;
  habit.archivedAt = null;
  habit.order = nextOrder;
  await habit.save();

  return res.json({
    habit: serializeHabit(habit, getSelectedDate(req)),
  });
};

export const reorderHabits = async (req: Request, res: Response) => {
  const uniqueIds = [...new Set(req.body.habitIds as string[])];

  const activeHabits = await HabitModel.find({
    userId: req.auth!.sub,
    isArchived: false,
  }).sort({ order: 1, createdAt: 1 });

  const activeIds = new Set(activeHabits.map((habit) => habit._id.toString()));

  for (const habitId of uniqueIds) {
    if (!activeIds.has(habitId)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Habit ${habitId} is not an active habit owned by the user`,
      );
    }
  }

  const reorderedIds = [
    ...uniqueIds,
    ...activeHabits
      .map((habit) => habit._id.toString())
      .filter((habitId) => !uniqueIds.includes(habitId)),
  ];

  await Promise.all(
    reorderedIds.map((habitId, index) =>
      HabitModel.updateOne(
        { _id: habitId, userId: req.auth!.sub, isArchived: false },
        { $set: { order: index } },
      ),
    ),
  );

  const updatedHabits = await HabitModel.find({
    userId: req.auth!.sub,
    isArchived: false,
  }).sort({ order: 1, createdAt: 1 });

  return res.json({
    habits: updatedHabits.map((habit) => serializeHabit(habit, getSelectedDate(req))),
  });
};

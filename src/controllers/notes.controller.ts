import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HabitModel } from "../models/habit.model";
import { NoteModel } from "../models/note.model";
import { ApiError } from "../utils/api-error";
import { toDateOnlyString } from "../utils/date";

const ensureOwnedHabit = async (userId: string, habitId: string) => {
  const habit = await HabitModel.findOne({ _id: habitId, userId });

  if (!habit) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Habit not found");
  }
};

const serializeNote = (note: {
  _id: { toString(): string };
  habitId: { toString(): string };
  content: string;
  date: string;
  createdAt?: Date;
  updatedAt?: Date;
}) => ({
  id: note._id.toString(),
  habitId: note.habitId.toString(),
  content: note.content,
  date: note.date,
  createdAt: note.createdAt?.toISOString() ?? null,
  updatedAt: note.updatedAt?.toISOString() ?? null,
});

export const listNotes = async (req: Request, res: Response) => {
  const habitId = String(req.params.habitId);
  await ensureOwnedHabit(req.auth!.sub, habitId);

  const page = typeof req.query.page === "number" ? req.query.page : 1;
  const limit = typeof req.query.limit === "number" ? req.query.limit : 20;
  const filters: Record<string, unknown> = { userId: req.auth!.sub, habitId };

  if (typeof req.query.date === "string") {
    filters.date = toDateOnlyString(req.query.date);
  }

  const [notes, total] = await Promise.all([
    NoteModel.find(filters)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    NoteModel.countDocuments(filters),
  ]);

  res.json({
    notes: notes.map(serializeNote),
    pagination: {
      page,
      limit,
      total,
    },
  });
};

export const createNote = async (req: Request, res: Response) => {
  const habitId = String(req.params.habitId);
  await ensureOwnedHabit(req.auth!.sub, habitId);

  const note = await NoteModel.create({
    userId: req.auth!.sub,
    habitId,
    content: req.body.content,
    date: req.body.date ? toDateOnlyString(req.body.date) : toDateOnlyString(new Date()),
  });

  res.status(StatusCodes.CREATED).json({ note: serializeNote(note) });
};

export const getNote = async (req: Request, res: Response) => {
  const note = await NoteModel.findOne({
    _id: String(req.params.noteId),
    habitId: String(req.params.habitId),
    userId: req.auth!.sub,
  });

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  res.json({ note: serializeNote(note) });
};

export const updateNote = async (req: Request, res: Response) => {
  const note = await NoteModel.findOne({
    _id: String(req.params.noteId),
    habitId: String(req.params.habitId),
    userId: req.auth!.sub,
  });

  if (!note) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  note.content = req.body.content;
  await note.save();
  res.json({ note: serializeNote(note) });
};

export const deleteNote = async (req: Request, res: Response) => {
  const result = await NoteModel.deleteOne({
    _id: String(req.params.noteId),
    habitId: String(req.params.habitId),
    userId: req.auth!.sub,
  });

  if (result.deletedCount === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Note not found");
  }

  res.status(StatusCodes.NO_CONTENT).send();
};

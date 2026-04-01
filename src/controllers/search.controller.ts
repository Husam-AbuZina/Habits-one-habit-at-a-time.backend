import type { Request, Response } from "express";
import { HabitModel } from "../models/habit.model";

const templates = [
  { id: "drink-water", title: "Drink Water", category: "health", goalCount: 8, intent: "build" },
  { id: "read", title: "Read", category: "learning", goalCount: 20, intent: "build" },
  { id: "no-soda", title: "No Soda", category: "health", goalCount: 0, intent: "break" },
];

export const searchHabits = async (req: Request, res: Response) => {
  const q = String(req.query.q).toLowerCase();
  const habits = await HabitModel.find({ userId: req.auth!.sub, title: { $regex: q, $options: "i" } }).sort({ createdAt: 1 });
  res.json({ habits });
};
export const getHabitTemplates = async (_req: Request, res: Response) => res.json({ templates });
export const getHabitTemplateCategories = async (_req: Request, res: Response) => res.json({ categories: [...new Set(templates.map((template) => template.category))] });

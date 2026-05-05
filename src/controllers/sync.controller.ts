import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { serializeSettings } from "./settings.controller";
import { HabitModel } from "../models/habit.model";
import { ensureUserSettings } from "../services/settings.service";
import { serializeHabit } from "../utils/habit";

const pickHabitUpdateFields = (habit: Record<string, unknown>) => ({
  clientId: typeof habit.id === "string" ? habit.id : typeof habit.clientId === "string" ? habit.clientId : null,
  title: habit.title,
  emoji: habit.emoji ?? null,
  goalCount: habit.goalCount,
  previousCompletedCount: habit.previousCompletedCount ?? 0,
  iconKey: habit.iconKey ?? null,
  colorValue: habit.colorValue ?? null,
  schedule: habit.schedule ?? null,
  description: habit.description ?? null,
  notes: Array.isArray(habit.notes) ? habit.notes : [],
  intent: habit.intent,
  goalFrequency: habit.goalFrequency ?? "daily",
  repeatMode: habit.repeatMode ?? "schedule",
  remindMe: habit.remindMe ?? null,
  unitType: habit.unitType ?? "count",
  customUnit: habit.customUnit ?? null,
  createdAt: habit.createdAt ?? undefined,
  allowsOverflow: habit.allowsOverflow ?? true,
  isArchived: habit.isArchived ?? false,
  archivedAt: habit.archivedAt ?? null,
  isTimerRunning: habit.isTimerRunning ?? false,
  skippedAt: habit.skippedAt ?? null,
  order: habit.order ?? 0,
  history: habit.history ?? undefined,
});

export const pullSnapshot = async (req: Request, res: Response) => {
  const [settings, habits] = await Promise.all([
    ensureUserSettings(req.auth!.sub),
    HabitModel.find({ userId: req.auth!.sub }).sort({ isArchived: 1, order: 1, createdAt: 1 }),
  ]);

  res.json({
    pulledAt: new Date().toISOString(),
    snapshot: {
      settings: serializeSettings(settings),
      habits: habits.map((habit) => serializeHabit(habit)),
    },
  });
};

export const pushSnapshot = async (req: Request, res: Response) => {
  if (req.body.settings) {
    const settings = await ensureUserSettings(req.auth!.sub);
    Object.assign(settings, req.body.settings);
    await settings.save();
  }

  const skippedHabitIds: string[] = [];

  if (Array.isArray(req.body.habits)) {
    for (const habit of req.body.habits as Array<Record<string, unknown>>) {
      const localId = typeof habit.id === "string" ? habit.id : null;
      const update = pickHabitUpdateFields(habit);

      if (localId && isValidObjectId(localId)) {
        await HabitModel.updateOne(
          { _id: localId, userId: req.auth!.sub },
          { $set: update },
        );
        continue;
      }

      if (localId) {
        const createdAt =
          typeof habit.createdAt === "string" || habit.createdAt instanceof Date
            ? new Date(habit.createdAt)
            : null;

        const matchFilter =
          createdAt && typeof habit.title === "string"
            ? {
                userId: req.auth!.sub,
                $or: [
                  { clientId: localId },
                  { title: habit.title, createdAt },
                ],
              }
            : {
                userId: req.auth!.sub,
                clientId: localId,
              };

        const result = await HabitModel.updateOne(matchFilter, { $set: update });

        if (result.matchedCount === 0) {
          skippedHabitIds.push(localId);
          console.warn("[sync] Skipped habit during push because no remote record matched local id", {
            userId: req.auth!.sub,
            localId,
            title: typeof habit.title === "string" ? habit.title : null,
          });
        }
      }
    }
  }

  res.json({
    applied: true,
    lastWriteWins: true,
    pushedAt: new Date().toISOString(),
    skippedHabitIds,
  });
};

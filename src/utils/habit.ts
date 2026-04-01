import { toDateOnlyString, toIsoDateOrNull } from "./date";

type HabitLike = {
  _id: { toString(): string };
  title: string;
  emoji?: string | null;
  goalCount: number;
  previousCompletedCount?: number | null;
  iconKey?: string | null;
  colorValue?: unknown;
  schedule?: unknown;
  notes?: string[] | null;
  intent: "build" | "break";
  goalFrequency?: string | null;
  repeatMode?: string | null;
  remindMe?: unknown;
  unitType?: "count" | "minutes" | "custom" | null;
  customUnit?: string | null;
  allowsOverflow?: boolean | null;
  isArchived?: boolean | null;
  archivedAt?: Date | null;
  isTimerRunning?: boolean | null;
  skippedAt?: Date | null;
  order?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  history?: {
    createdAt?: Date;
    entries?: Array<{
      date: string;
      completedCount: number;
      status: "undone" | "partial" | "done";
      isSkipped: boolean;
    }>;
  } | null;
};

const emptyEntry = {
  completedCount: 0,
  status: "undone" as const,
  isSkipped: false,
};

export const serializeHabit = (habit: HabitLike, selectedDate?: string) => {
  const dateKey = selectedDate ? toDateOnlyString(selectedDate) : toDateOnlyString(new Date());
  const dayEntry =
    habit.history?.entries?.find((entry) => entry.date === dateKey) ?? emptyEntry;

  return {
    id: habit._id.toString(),
    title: habit.title,
    emoji: habit.emoji ?? null,
    goalCount: habit.goalCount,
    completedCount: dayEntry.completedCount,
    previousCompletedCount: habit.previousCompletedCount ?? 0,
    iconKey: habit.iconKey ?? null,
    colorValue: habit.colorValue ?? null,
    schedule: habit.schedule ?? null,
    notes: habit.notes ?? [],
    intent: habit.intent,
    goalFrequency: habit.goalFrequency ?? "daily",
    repeatMode: habit.repeatMode ?? "schedule",
    remindMe: habit.remindMe ?? null,
    unitType: habit.unitType ?? "count",
    customUnit: habit.customUnit ?? null,
    createdAt: habit.createdAt?.toISOString() ?? null,
    allowsOverflow: habit.allowsOverflow ?? true,
    isArchived: habit.isArchived ?? false,
    archivedAt: habit.archivedAt?.toISOString() ?? null,
    isTimerRunning: habit.isTimerRunning ?? false,
    skippedAt: dayEntry.isSkipped ? toIsoDateOrNull(dateKey) : toIsoDateOrNull(habit.skippedAt?.toISOString()),
    order: habit.order ?? 0,
    selectedDate: dateKey,
    dayStatus: dayEntry.status,
    history: {
      createdAt: habit.history?.createdAt?.toISOString() ?? null,
      entries:
        habit.history?.entries?.map((entry) => ({
          date: entry.date,
          completedCount: entry.completedCount,
          status: entry.status,
          isSkipped: entry.isSkipped,
        })) ?? [],
    },
    updatedAt: habit.updatedAt?.toISOString() ?? null,
  };
};

export const countCompletionStatus = (habit: HabitLike, selectedDate?: string) => {
  const dateKey = selectedDate ? toDateOnlyString(selectedDate) : toDateOnlyString(new Date());
  const dayEntry =
    habit.history?.entries?.find((entry) => entry.date === dateKey) ?? emptyEntry;

  if (dayEntry.isSkipped) {
    return { isCompleted: false, isSkipped: true };
  }

  if (habit.intent === "build") {
    return {
      isCompleted: dayEntry.completedCount >= habit.goalCount,
      isSkipped: false,
    };
  }

  return {
    isCompleted: dayEntry.completedCount === 0,
    isSkipped: false,
  };
};

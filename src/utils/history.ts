import { toDateOnlyString } from "./date";
import { deriveHistoryStatus } from "./habit";

export type HistoryEntry = {
  date: string;
  completedCount: number;
  status: "undone" | "partial" | "done";
  isSkipped: boolean;
};

export const sortHistoryEntries = (entries: HistoryEntry[]) =>
  [...entries].sort((a, b) => a.date.localeCompare(b.date));

export const serializeHistoryEntry = (
  entry: HistoryEntry | null,
  habit: { intent: "build" | "break"; goalCount: number },
) =>
  entry
    ? {
        date: entry.date,
        completedCount: entry.completedCount,
        status: entry.status,
        isSkipped: entry.isSkipped,
        isCompleted:
          !entry.isSkipped &&
          (habit.intent === "build"
            ? entry.completedCount >= habit.goalCount
            : entry.completedCount === 0),
        isFailed:
          !entry.isSkipped &&
          habit.intent === "break" &&
          entry.completedCount > habit.goalCount,
      }
    : null;

export const upsertHistoryEntry = (
  habit: any,
  date: string,
  patch: Partial<HistoryEntry>,
  replace: boolean,
) => {
  const dateKey = toDateOnlyString(date);
  const existingIndex = habit.history.entries.findIndex((entry: HistoryEntry) => entry.date === dateKey);

  const base: HistoryEntry =
    existingIndex >= 0
      ? {
          date: habit.history.entries[existingIndex]!.date,
          completedCount: habit.history.entries[existingIndex]!.completedCount,
          status: habit.history.entries[existingIndex]!.status,
          isSkipped: habit.history.entries[existingIndex]!.isSkipped,
        }
      : {
          date: dateKey,
          completedCount: 0,
          status: "undone",
          isSkipped: false,
        };

  const next = replace
    ? {
        date: dateKey,
        completedCount: patch.completedCount ?? 0,
        isSkipped: patch.isSkipped ?? false,
        status:
          patch.status ??
          deriveHistoryStatus({
            intent: habit.intent,
            goalCount: habit.goalCount,
            completedCount: patch.completedCount ?? 0,
            isSkipped: patch.isSkipped ?? false,
          }),
      }
    : {
        ...base,
        ...patch,
      };

  next.status = deriveHistoryStatus({
    intent: habit.intent,
    goalCount: habit.goalCount,
    completedCount: next.completedCount,
    isSkipped: next.isSkipped,
  });

  if (existingIndex >= 0) {
    habit.history.entries[existingIndex]!.date = next.date;
    habit.history.entries[existingIndex]!.completedCount = next.completedCount;
    habit.history.entries[existingIndex]!.status = next.status;
    habit.history.entries[existingIndex]!.isSkipped = next.isSkipped;
  } else {
    habit.history.entries.push(next);
  }

  habit.skippedAt =
    next.isSkipped && dateKey === toDateOnlyString(new Date()) ? new Date(dateKey) : habit.skippedAt;

  return next;
};

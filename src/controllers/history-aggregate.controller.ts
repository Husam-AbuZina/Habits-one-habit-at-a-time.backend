import type { Request, Response } from "express";
import { HabitModel } from "../models/habit.model";
import { countCompletionStatus, serializeHabit } from "../utils/habit";
import { diffUtcDays, startOfUtcDay, toDateOnlyString } from "../utils/date";
import { isScheduleActiveOnDate } from "../utils/schedule";

const parseRangeDays = (range?: string) => {
  if (!range) {
    return 31;
  }

  const match = /^(\d+)d$/i.exec(range.trim());
  return match ? Math.max(1, Number(match[1])) : 31;
};

const buildDateRange = (rangeDays: number, endDate = new Date()) => {
  const end = startOfUtcDay(endDate);
  return Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date(end.getTime() - (rangeDays - 1 - index) * 86400000);
    return toDateOnlyString(date);
  });
};

const getStatusForDate = (habit: any, date: string) => {
  const entry = habit.history?.entries?.find((item: { date: string }) => item.date === date);
  const completion = countCompletionStatus(habit, date);

  return {
    date,
    completedCount: entry?.completedCount ?? 0,
    status: entry?.status ?? (habit.intent === "break" ? "done" : "undone"),
    isSkipped: entry?.isSkipped ?? false,
    isCompleted: completion.isCompleted,
    isFailed:
      !entry?.isSkipped &&
      habit.intent === "break" &&
      (entry?.completedCount ?? 0) > habit.goalCount,
    isScheduled: isScheduleActiveOnDate(habit.schedule as Record<string, unknown> | null, date),
  };
};

export const getDailyTrends = async (req: Request, res: Response) => {
  const rangeDays = parseRangeDays(typeof req.query.range === "string" ? req.query.range : undefined);
  const dates = buildDateRange(rangeDays);
  const habits = await HabitModel.find({
    userId: req.auth!.sub,
    isArchived: false,
  }).sort({ order: 1, createdAt: 1 });

  const daily = dates.map((date) => {
    const visibleHabits = habits.filter((habit) =>
      isScheduleActiveOnDate(habit.schedule as Record<string, unknown> | null, date),
    );
    const eligibleHabits = visibleHabits.filter((habit) => !getStatusForDate(habit, date).isSkipped);
    const completedHabits = eligibleHabits.filter((habit) => getStatusForDate(habit, date).isCompleted);
    const failedBreakHabits = visibleHabits.filter((habit) => getStatusForDate(habit, date).isFailed);

    return {
      date,
      totalHabits: visibleHabits.length,
      eligibleHabits: eligibleHabits.length,
      completedHabits: completedHabits.length,
      skippedHabits: visibleHabits.length - eligibleHabits.length,
      failedBreakHabits: failedBreakHabits.length,
      progressPercent:
        eligibleHabits.length > 0 ? Math.round((completedHabits.length / eligibleHabits.length) * 100) : 0,
    };
  });

  res.json({
    range: `${rangeDays}d`,
    dates: {
      from: dates[0] ?? null,
      to: dates[dates.length - 1] ?? null,
    },
    daily,
  });
};

export const getHistoryHabits = async (req: Request, res: Response) => {
  const rangeDays = parseRangeDays(typeof req.query.range === "string" ? req.query.range : undefined);
  const dates = buildDateRange(rangeDays);
  const from = dates[0];
  const habits = await HabitModel.find({
    userId: req.auth!.sub,
    isArchived: false,
  }).sort({ order: 1, createdAt: 1 });

  const habitSummaries = habits.map((habit) => {
    const dayStatuses = dates
      .filter((date) => isScheduleActiveOnDate(habit.schedule as Record<string, unknown> | null, date))
      .map((date) => getStatusForDate(habit, date));

    const eligibleDays = dayStatuses.filter((day) => !day.isSkipped);
    const completedDays = eligibleDays.filter((day) => day.isCompleted);
    const failedDays = dayStatuses.filter((day) => day.isFailed);

    return {
      habit: serializeHabit(habit),
      summary: {
        range: `${rangeDays}d`,
        from,
        to: dates[dates.length - 1] ?? null,
        scheduledDays: dayStatuses.length,
        eligibleDays: eligibleDays.length,
        completedDays: completedDays.length,
        skippedDays: dayStatuses.filter((day) => day.isSkipped).length,
        failedDays: failedDays.length,
        completionRate:
          eligibleDays.length > 0 ? Math.round((completedDays.length / eligibleDays.length) * 100) : 0,
      },
      days: dayStatuses,
    };
  });

  res.json({
    range: `${rangeDays}d`,
    habits: habitSummaries,
  });
};

export const getArchiveHistory = async (req: Request, res: Response) => {
  const archivedHabits = await HabitModel.find({
    userId: req.auth!.sub,
    isArchived: true,
  }).sort({ archivedAt: -1, updatedAt: -1 });

  res.json({
    archive: archivedHabits.map((habit) => {
      const firstDate = habit.history.entries.reduce<string | null>(
        (min, entry) => (min === null || entry.date < min ? entry.date : min),
        null,
      );
      const lastDate = habit.history.entries.reduce<string | null>(
        (max, entry) => (max === null || entry.date > max ? entry.date : max),
        null,
      );

      return {
        habit: serializeHabit(habit),
        archivedAt: habit.archivedAt?.toISOString() ?? null,
        historySummary: {
          entriesCount: habit.history.entries.length,
          firstEntryDate: firstDate,
          lastEntryDate: lastDate,
        },
      };
    }),
    total: archivedHabits.length,
  });
};

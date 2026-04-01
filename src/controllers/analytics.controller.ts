import type { Request, Response } from "express";
import { HabitModel } from "../models/habit.model";
import { countCompletionStatus } from "../utils/habit";
import { startOfUtcDay, toDateOnlyString } from "../utils/date";
import { isScheduleActiveOnDate } from "../utils/schedule";

const parseRange = (range?: string) => {
  const value = range ?? "31D";
  const match = /^(\d+)([DWM])$/i.exec(value);
  if (!match) return { count: 31, unit: "D" as const };
  return { count: Number(match[1]), unit: match[2]!.toUpperCase() as "D" | "W" | "M" };
};

const buildDailyDates = (range?: string) => {
  const { count, unit } = parseRange(range);
  const multiplier = unit === "D" ? 1 : unit === "W" ? 7 : 30;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(startOfUtcDay(new Date()).getTime() - (count - 1 - index) * multiplier * 86400000);
    return toDateOnlyString(date);
  });
};

const getHabits = async (userId: string, archived?: boolean) =>
  HabitModel.find({ userId, ...(archived === undefined ? {} : { isArchived: archived }) }).sort({ order: 1, createdAt: 1 });

const habitDay = (habit: any, date: string) => {
  const completion = countCompletionStatus(habit, date);
  const entry = habit.history.entries.find((item: any) => item.date === date);
  return {
    date,
    completed: completion.isCompleted,
    skipped: completion.isSkipped,
    failed: !entry?.isSkipped && habit.intent === "break" && (entry?.completedCount ?? 0) > habit.goalCount,
    scheduled: isScheduleActiveOnDate(habit.schedule as Record<string, unknown> | null, date),
    count: entry?.completedCount ?? 0,
  };
};

const weekKey = (date: string) => {
  const day = startOfUtcDay(date);
  return `${day.getUTCFullYear()}-W${String(Math.floor((day.getUTCDate() - 1) / 7) + 1).padStart(2, "0")}`;
};

export const getAnalyticsSummary = async (req: Request, res: Response) => {
  const habits = await getHabits(req.auth!.sub, false);
  const dates = buildDailyDates("90D");
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;
  let completedCount = 0;

  for (const date of dates) {
    const active = habits.filter((habit) => isScheduleActiveOnDate(habit.schedule as any, date));
    const eligible = active.filter((habit) => !habitDay(habit, date).skipped);
    const completed = eligible.filter((habit) => habitDay(habit, date).completed);
    completedCount += completed.length;
    const dayComplete = eligible.length > 0 && completed.length === eligible.length;
    run = dayComplete ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }
  for (let i = dates.length - 1; i >= 0; i -= 1) {
    const active = habits.filter((habit) => isScheduleActiveOnDate(habit.schedule as any, dates[i]!));
    const eligible = active.filter((habit) => !habitDay(habit, dates[i]!).skipped);
    const completed = eligible.filter((habit) => habitDay(habit, dates[i]!).completed);
    if (eligible.length > 0 && completed.length === eligible.length) currentStreak += 1;
    else break;
  }
  res.json({ longestStreak, currentStreak, completedCount });
};

const dailySeries = async (userId: string, range?: string, archived = false) => {
  const dates = buildDailyDates(range);
  const habits = await getHabits(userId, archived);
  return dates.map((date) => {
    const active = habits.filter((habit) => isScheduleActiveOnDate(habit.schedule as any, date));
    const eligible = active.filter((habit) => !habitDay(habit, date).skipped);
    const completed = eligible.filter((habit) => habitDay(habit, date).completed);
    return { date, eligible: eligible.length, completed: completed.length, failed: active.filter((h) => habitDay(h, date).failed).length };
  });
};

const weeklySeries = async (userId: string, range?: string, archived = false) => {
  const daily = await dailySeries(userId, range, archived);
  const weeks = new Map<string, { week: string; eligible: number; completed: number; failed: number }>();
  for (const day of daily) {
    const key = weekKey(day.date);
    const current = weeks.get(key) ?? { week: key, eligible: 0, completed: 0, failed: 0 };
    current.eligible += day.eligible;
    current.completed += day.completed;
    current.failed += day.failed;
    weeks.set(key, current);
  }
  return [...weeks.values()];
};

export const getAnalyticsTrendsDaily = async (req: Request, res: Response) => res.json({ range: req.query.range ?? "31D", series: await dailySeries(req.auth!.sub, String(req.query.range ?? "31D"), false) });
export const getAnalyticsTrendsWeekly = async (req: Request, res: Response) => res.json({ range: req.query.range ?? "26W", series: await weeklySeries(req.auth!.sub, String(req.query.range ?? "26W"), false) });
export const getAnalyticsHabitsDaily = async (req: Request, res: Response) => res.json({ range: req.query.range ?? "7D", habits: await getHabits(req.auth!.sub, false).then((habits) => habits.map((habit) => ({ habitId: String(habit._id), title: habit.title, days: buildDailyDates(String(req.query.range ?? "7D")).map((date) => habitDay(habit, date)) }))) });
export const getAnalyticsHabitsDailyGrid = async (req: Request, res: Response) => res.json({ grid: await getHabits(req.auth!.sub, false).then((habits) => habits.map((habit) => ({ habitId: String(habit._id), title: habit.title, cells: buildDailyDates("31D").map((date) => habitDay(habit, date)) }))) });
export const getAnalyticsHabitsWeekly = async (req: Request, res: Response) => res.json({ range: req.query.range ?? "7W", series: await weeklySeries(req.auth!.sub, String(req.query.range ?? "7W"), false) });
export const getAnalyticsHabitsWeeklyGrid = async (req: Request, res: Response) => res.json({ grid: await weeklySeries(req.auth!.sub, "26W", false) });
export const getAnalyticsArchiveDaily = async (req: Request, res: Response) => res.json({ range: req.query.range ?? "7D", series: await dailySeries(req.auth!.sub, String(req.query.range ?? "7D"), true) });
export const getAnalyticsArchiveDailyGrid = async (req: Request, res: Response) => res.json({ grid: await getHabits(req.auth!.sub, true).then((habits) => habits.map((habit) => ({ habitId: String(habit._id), title: habit.title, cells: buildDailyDates("31D").map((date) => habitDay(habit, date)) }))) });
export const getAnalyticsArchiveWeekly = async (req: Request, res: Response) => res.json({ range: req.query.range ?? "7W", series: await weeklySeries(req.auth!.sub, String(req.query.range ?? "7W"), true) });
export const getHabitStats = async (req: Request, res: Response) => {
  const habit = await HabitModel.findOne({ _id: String(req.params.habitId), userId: req.auth!.sub });
  if (!habit) return res.status(404).json({ message: "Habit not found" });
  const days = buildDailyDates("31D").map((date) => habitDay(habit, date));
  res.json({ habitId: String(habit._id), completedDays: days.filter((d) => d.completed).length, failedDays: days.filter((d) => d.failed).length, skippedDays: days.filter((d) => d.skipped).length });
};
export const getHabitDailySeries = async (req: Request, res: Response) => {
  const habit = await HabitModel.findOne({ _id: String(req.params.habitId), userId: req.auth!.sub });
  if (!habit) return res.status(404).json({ message: "Habit not found" });
  res.json({ habitId: String(habit._id), series: buildDailyDates("31D").map((date) => habitDay(habit, date)) });
};
export const getHabitWeeklySeries = async (req: Request, res: Response) => {
  const habit = await HabitModel.findOne({ _id: String(req.params.habitId), userId: req.auth!.sub });
  if (!habit) return res.status(404).json({ message: "Habit not found" });
  const weeks = new Map<string, number>();
  for (const day of buildDailyDates("26W").map((date) => habitDay(habit, date))) {
    const key = weekKey(day.date);
    weeks.set(key, (weeks.get(key) ?? 0) + (day.completed ? 1 : 0));
  }
  res.json({ habitId: String(habit._id), series: [...weeks.entries()].map(([week, completed]) => ({ week, completed })) });
};
export const getHabitHeatmap = async (req: Request, res: Response) => {
  const habit = await HabitModel.findOne({ _id: String(req.params.habitId), userId: req.auth!.sub });
  if (!habit) return res.status(404).json({ message: "Habit not found" });
  res.json({ habitId: String(habit._id), heatmap: buildDailyDates("90D").map((date) => habitDay(habit, date)) });
};

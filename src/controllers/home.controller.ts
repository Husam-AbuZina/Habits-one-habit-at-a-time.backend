import type { Request, Response } from "express";
import { HabitModel } from "../models/habit.model";
import { ensureUserSettings } from "../services/settings.service";
import { countCompletionStatus, serializeHabit } from "../utils/habit";
import { isScheduleActiveOnDate } from "../utils/schedule";
import { diffUtcDays, startOfUtcDay, toDateOnlyString, weekdayName } from "../utils/date";

const buildWeekStrip = (selectedDate: string, weekStartsOn: "sunday" | "monday") => {
  const selected = startOfUtcDay(selectedDate);
  const weekday = selected.getUTCDay();
  const startOffset = weekStartsOn === "monday" ? (weekday === 0 ? 6 : weekday - 1) : weekday;
  const start = new Date(selected.getTime() - startOffset * 86400000);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * 86400000);
    const dateKey = toDateOnlyString(date);
    return {
      date: dateKey,
      weekday: weekdayName(dateKey),
      isSelected: dateKey === selectedDate,
      isToday: dateKey === toDateOnlyString(new Date()),
    };
  });
};

const getHomeContext = async (userId: string, date: string) => {
  const selectedDate = toDateOnlyString(date);
  const [settings, habits] = await Promise.all([
    ensureUserSettings(userId),
    HabitModel.find({ userId, isArchived: false }).sort({ order: 1, createdAt: 1 }),
  ]);

  const visibleHabits = habits
    .filter((habit) => isScheduleActiveOnDate(habit.schedule as Record<string, unknown> | null, selectedDate))
    .map((habit) => ({
      habit,
      serialized: serializeHabit(habit, selectedDate),
      completion: countCompletionStatus(habit, selectedDate),
    }));

  const totalHabits = visibleHabits.length;
  const skippedHabits = visibleHabits.filter((item) => item.completion.isSkipped).length;
  const completedHabits = visibleHabits.filter((item) => item.completion.isCompleted).length;
  const eligibleHabits = totalHabits - skippedHabits;
  const progressPercent = eligibleHabits > 0 ? Math.round((completedHabits / eligibleHabits) * 100) : 0;

  const habitsForHome = visibleHabits
    .sort((a, b) => Number(a.serialized.skippedAt !== null) - Number(b.serialized.skippedAt !== null))
    .map((item) => item.serialized);

  return {
    selectedDate,
    settings,
    habitsForHome,
    progress: {
      totalHabits,
      eligibleHabits,
      completedHabits,
      skippedHabits,
      progressPercent,
    },
  };
};

export const getHome = async (req: Request, res: Response) => {
  const selectedDate = toDateOnlyString(String(req.params.date));
  const includeWeekStrip = req.query.includeWeekStrip !== "false";
  const home = await getHomeContext(req.auth!.sub, selectedDate);

  res.json({
    date: selectedDate,
    title: selectedDate === toDateOnlyString(new Date()) ? "Today" : weekdayName(selectedDate),
    settings: {
      weekStartsOn: home.settings.weekStartsOn,
      vacationModeEnabled: home.settings.vacationModeEnabled,
    },
    progress: home.progress,
    weekStrip: includeWeekStrip
      ? buildWeekStrip(selectedDate, home.settings.weekStartsOn as "sunday" | "monday")
      : undefined,
    habits: home.habitsForHome,
  });
};

export const getHomeWeekStrip = async (req: Request, res: Response) => {
  const selectedDate = toDateOnlyString(String(req.params.date));
  const settings = await ensureUserSettings(req.auth!.sub);
  res.json({
    date: selectedDate,
    weekStartsOn: settings.weekStartsOn,
    days: buildWeekStrip(selectedDate, settings.weekStartsOn as "sunday" | "monday"),
  });
};

export const getHomeProgress = async (req: Request, res: Response) => {
  const selectedDate = toDateOnlyString(String(req.params.date));
  const home = await getHomeContext(req.auth!.sub, selectedDate);
  res.json({
    date: selectedDate,
    progress: home.progress,
  });
};

export const getHomeHabits = async (req: Request, res: Response) => {
  const selectedDate = toDateOnlyString(String(req.params.date));
  const includeSkipped = req.query.includeSkipped !== "false";
  const home = await getHomeContext(req.auth!.sub, selectedDate);
  res.json({
    date: selectedDate,
    habits: includeSkipped
      ? home.habitsForHome
      : home.habitsForHome.filter((habit) => habit.skippedAt === null),
  });
};

export const getHomeByQuery = async (req: Request, res: Response) => {
  req.params.date = typeof req.query.date === "string" ? req.query.date : toDateOnlyString(new Date());
  return getHome(req, res);
};

export const getHomeWeekByQuery = async (req: Request, res: Response) => {
  req.params.date =
    typeof req.query.anchorDate === "string" ? req.query.anchorDate : toDateOnlyString(new Date());
  return getHomeWeekStrip(req, res);
};

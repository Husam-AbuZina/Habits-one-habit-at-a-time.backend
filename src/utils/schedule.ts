import { diffUtcDays, startOfUtcDay, toDateOnlyString, weekdayName } from "./date";

type ScheduleLike = {
  startDate?: string | null;
  endDate?: string | null;
  weekdays?: string[] | null;
  dates?: string[] | null;
  excludedDates?: string[] | null;
  repeatEveryDays?: number | null;
  isPaused?: boolean | null;
};

const matchesWeekdays = (schedule: ScheduleLike, dateKey: string) => {
  if (!schedule.weekdays || schedule.weekdays.length === 0) {
    return true;
  }

  return schedule.weekdays.includes(weekdayName(dateKey));
};

const matchesExplicitDates = (schedule: ScheduleLike, dateKey: string) => {
  if (!schedule.dates || schedule.dates.length === 0) {
    return true;
  }

  return schedule.dates.includes(dateKey);
};

const matchesRepeatInterval = (schedule: ScheduleLike, dateKey: string) => {
  if (!schedule.repeatEveryDays || schedule.repeatEveryDays <= 1) {
    return true;
  }

  const anchor = schedule.startDate ? toDateOnlyString(schedule.startDate) : dateKey;
  const diff = diffUtcDays(anchor, dateKey);
  return diff >= 0 && diff % schedule.repeatEveryDays === 0;
};

export const isScheduleActiveOnDate = (schedule: ScheduleLike | null | undefined, date: string) => {
  if (!schedule) {
    return true;
  }

  if (schedule.isPaused) {
    return false;
  }

  const dateKey = toDateOnlyString(date);
  const target = startOfUtcDay(dateKey).getTime();

  if (schedule.startDate && target < startOfUtcDay(schedule.startDate).getTime()) {
    return false;
  }

  if (schedule.endDate && target > startOfUtcDay(schedule.endDate).getTime()) {
    return false;
  }

  if (schedule.excludedDates?.includes(dateKey)) {
    return false;
  }

  return (
    matchesExplicitDates(schedule, dateKey) &&
    matchesWeekdays(schedule, dateKey) &&
    matchesRepeatInterval(schedule, dateKey)
  );
};

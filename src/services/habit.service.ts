import { HabitModel } from "../models/habit.model";
import { countCompletionStatus } from "../utils/habit";

export const getHabitCounters = async (userId: string, selectedDate?: string) => {
  const habits = await HabitModel.find({ userId }).lean();

  let activeHabitsCount = 0;
  let archivedHabitsCount = 0;
  let todayCompletedCount = 0;
  let todaySkippedCount = 0;

  for (const habit of habits) {
    if (habit.isArchived) {
      archivedHabitsCount += 1;
    } else {
      activeHabitsCount += 1;
    }

    const status = countCompletionStatus(habit, selectedDate);

    if (!habit.isArchived && status.isSkipped) {
      todaySkippedCount += 1;
    }

    if (!habit.isArchived && status.isCompleted) {
      todayCompletedCount += 1;
    }
  }

  return {
    activeHabitsCount,
    archivedHabitsCount,
    todayCompletedCount,
    todaySkippedCount,
  };
};

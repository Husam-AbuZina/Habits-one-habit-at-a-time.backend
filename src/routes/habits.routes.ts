import { Router } from "express";
import {
  archiveHabit,
  createHabit,
  deleteHabit,
  getHabit,
  listHabits,
  reorderHabits,
  unarchiveHabit,
  updateHabit,
} from "../controllers/habits.controller";
import { addHabitToList, removeHabitFromList } from "../controllers/lists.controller";
import { recalculateHabit } from "../controllers/rules.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createHabitSchema,
  habitIdSchema,
  habitListParamsSchema,
  listHabitsSchema,
  reorderHabitsSchema,
  updateHabitSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";
import dayActionsRoutes from "./day-actions.routes";
import historyRoutes from "./history.routes";
import { actionRouter } from "./history-actions.routes";
import habitRemindersRoutes from "./habit-reminders.routes";
import notesRoutes from "./notes.routes";
import rulesRoutes from "./rules.routes";
import scheduleRoutes from "./schedule.routes";
import streaksRoutes from "./streaks.routes";
import timerRoutes from "./timer.routes";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createHabitSchema), asyncHandler(createHabit));
router.get("/", validate(listHabitsSchema), asyncHandler(listHabits));
router.patch("/reorder", validate(reorderHabitsSchema), asyncHandler(reorderHabits));
router.get("/:habitId", validate(habitIdSchema), asyncHandler(getHabit));
router.patch(
  "/:habitId",
  validate(habitIdSchema),
  validate(updateHabitSchema),
  asyncHandler(updateHabit),
);
router.delete("/:habitId", validate(habitIdSchema), asyncHandler(deleteHabit));
router.post("/:habitId/archive", validate(habitIdSchema), asyncHandler(archiveHabit));
router.post("/:habitId/unarchive", validate(habitIdSchema), asyncHandler(unarchiveHabit));
router.post("/:habitId/lists/:listId", validate(habitListParamsSchema), asyncHandler(addHabitToList));
router.delete("/:habitId/lists/:listId", validate(habitListParamsSchema), asyncHandler(removeHabitFromList));
router.use("/:habitId/schedule", scheduleRoutes);
router.use("/:habitId/notes", notesRoutes);
router.use("/:habitId/reminders", habitRemindersRoutes);
router.use("/:habitId/history", historyRoutes);
router.use("/:habitId/actions", actionRouter);
router.use("/:habitId/days/:date", dayActionsRoutes);
router.use("/:habitId/days/:date", rulesRoutes);
router.use("/:habitId/timer", timerRoutes);
router.use("/:habitId/streaks", streaksRoutes);
router.post("/:habitId/recalculate", validate(habitIdSchema), asyncHandler(recalculateHabit));

export default router;

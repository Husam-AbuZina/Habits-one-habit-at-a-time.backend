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
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createHabitSchema,
  habitIdSchema,
  listHabitsSchema,
  reorderHabitsSchema,
  updateHabitSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";
import descriptionRoutes from "./description.routes";
import historyRoutes from "./history.routes";
import { actionRouter } from "./history-actions.routes";
import habitRemindersRoutes from "./habit-reminders.routes";

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
router.use("/:habitId/description", descriptionRoutes);
router.use("/:habitId/reminders", habitRemindersRoutes);
router.use("/:habitId/history", historyRoutes);
router.use("/:habitId/actions", actionRouter);

export default router;

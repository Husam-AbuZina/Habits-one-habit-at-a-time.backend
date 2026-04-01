import { Router } from "express";
import {
  createHabitReminder,
  deleteHabitReminder,
  listHabitReminders,
  updateHabitReminder,
} from "../controllers/reminders.controller";
import { validate } from "../middleware/validate";
import {
  createReminderSchema,
  reminderIdSchema,
  updateReminderSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(listHabitReminders));
router.post("/", validate(createReminderSchema), asyncHandler(createHabitReminder));
router.patch("/:reminderId", validate(updateReminderSchema), asyncHandler(updateHabitReminder));
router.delete("/:reminderId", validate(reminderIdSchema), asyncHandler(deleteHabitReminder));

export default router;

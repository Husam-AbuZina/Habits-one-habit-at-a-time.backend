import { Router } from "express";
import {
  createReminder,
  deleteReminder,
  getNotificationPreferences,
  listReminders,
  patchNotificationPreferences,
  testNotification,
  updateReminder,
} from "../controllers/reminders.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createReminderSchema,
  notificationPrefsSchema,
  reminderIdSchema,
  remindersQuerySchema,
  updateReminderSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.get("/reminders", validate(remindersQuerySchema), asyncHandler(listReminders));
router.post("/reminders", validate(createReminderSchema), asyncHandler(createReminder));
router.patch("/reminders/:reminderId", validate(updateReminderSchema), asyncHandler(updateReminder));
router.delete("/reminders/:reminderId", validate(reminderIdSchema), asyncHandler(deleteReminder));
router.post("/notifications/test", asyncHandler(testNotification));
router.get("/notifications/preferences", asyncHandler(getNotificationPreferences));
router.patch("/notifications/preferences", validate(notificationPrefsSchema), asyncHandler(patchNotificationPreferences));

export default router;

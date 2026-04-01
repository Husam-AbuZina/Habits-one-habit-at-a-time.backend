import { Router } from "express";
import {
  deleteSchedule,
  getSchedule,
  patchSchedule,
  putSchedule,
  validateScheduleDate,
} from "../controllers/schedule.controller";
import { validate } from "../middleware/validate";
import {
  habitIdSchema,
  patchScheduleSchema,
  putScheduleSchema,
  scheduleValidationSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });

router.get("/", validate(habitIdSchema), asyncHandler(getSchedule));
router.put("/", validate(habitIdSchema), validate(putScheduleSchema), asyncHandler(putSchedule));
router.patch(
  "/",
  validate(habitIdSchema),
  validate(patchScheduleSchema),
  asyncHandler(patchSchedule),
);
router.delete("/", validate(habitIdSchema), asyncHandler(deleteSchedule));
router.post(
  "/validate-date",
  validate(habitIdSchema),
  validate(scheduleValidationSchema),
  asyncHandler(validateScheduleDate),
);

export default router;

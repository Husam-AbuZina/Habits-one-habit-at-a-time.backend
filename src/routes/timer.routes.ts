import { Router } from "express";
import {
  cancelTimer,
  getTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
} from "../controllers/timer.controller";
import { validate } from "../middleware/validate";
import {
  habitIdSchema,
  timerCancelSchema,
  timerStartSchema,
  timerStopSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });

router.get("/", validate(habitIdSchema), asyncHandler(getTimer));
router.post("/start", validate(habitIdSchema), validate(timerStartSchema), asyncHandler(startTimer));
router.post("/pause", validate(habitIdSchema), asyncHandler(pauseTimer));
router.post("/resume", validate(habitIdSchema), asyncHandler(resumeTimer));
router.post("/stop", validate(habitIdSchema), validate(timerStopSchema), asyncHandler(stopTimer));
router.post("/cancel", validate(habitIdSchema), validate(timerCancelSchema), asyncHandler(cancelTimer));

export default router;

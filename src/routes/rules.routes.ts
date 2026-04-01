import { Router } from "express";
import {
  getDayStatus,
  recalculateDayStatus,
  recalculateHabit,
} from "../controllers/rules.controller";
import { validate } from "../middleware/validate";
import { habitDayParamsSchema, habitIdSchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });

router.get("/status", validate(habitDayParamsSchema), asyncHandler(getDayStatus));
router.post("/recalculate", validate(habitDayParamsSchema), asyncHandler(recalculateDayStatus));
router.post("/habit-recalculate", validate(habitIdSchema), asyncHandler(recalculateHabit));

export default router;

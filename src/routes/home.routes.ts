import { Router } from "express";
import {
  getHome,
  getHomeHabits,
  getHomeProgress,
  getHomeWeekStrip,
} from "../controllers/home.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { homeDateSchema, homeHabitsQuerySchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);

router.get("/:date", validate(homeDateSchema), asyncHandler(getHome));
router.get("/:date/week-strip", validate(homeDateSchema), asyncHandler(getHomeWeekStrip));
router.get("/:date/progress", validate(homeDateSchema), asyncHandler(getHomeProgress));
router.get("/:date/habits", validate(homeHabitsQuerySchema), asyncHandler(getHomeHabits));

export default router;

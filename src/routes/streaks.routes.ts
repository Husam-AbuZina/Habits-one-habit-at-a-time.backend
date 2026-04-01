import { Router } from "express";
import { getHabitStreaks } from "../controllers/streaks.controller";
import { validate } from "../middleware/validate";
import { streakHabitSchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });
router.get("/", validate(streakHabitSchema), asyncHandler(getHabitStreaks));

export default router;

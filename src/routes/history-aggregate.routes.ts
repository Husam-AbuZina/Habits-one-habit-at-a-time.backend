import { Router } from "express";
import {
  getArchiveHistory,
  getDailyTrends,
  getHistoryHabits,
} from "../controllers/history-aggregate.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { historyAggregateRangeSchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);

router.get("/trends/daily", validate(historyAggregateRangeSchema), asyncHandler(getDailyTrends));
router.get("/habits", validate(historyAggregateRangeSchema), asyncHandler(getHistoryHabits));
router.get("/archive", asyncHandler(getArchiveHistory));

export default router;

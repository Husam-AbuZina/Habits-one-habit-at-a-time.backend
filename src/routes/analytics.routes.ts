import { Router } from "express";
import {
  getAnalyticsArchiveDaily,
  getAnalyticsArchiveWeekly,
  getAnalyticsHabitsDaily,
  getAnalyticsHabitsWeekly,
  getAnalyticsSummary,
  getAnalyticsTrendsDaily,
  getAnalyticsTrendsWeekly,
} from "../controllers/analytics.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.get("/summary", asyncHandler(getAnalyticsSummary));
router.get("/trends/daily", asyncHandler(getAnalyticsTrendsDaily));
router.get("/trends/weekly", asyncHandler(getAnalyticsTrendsWeekly));
router.get("/habits/daily", asyncHandler(getAnalyticsHabitsDaily));
router.get("/habits/weekly", asyncHandler(getAnalyticsHabitsWeekly));
router.get("/archive/daily", asyncHandler(getAnalyticsArchiveDaily));
router.get("/archive/weekly", asyncHandler(getAnalyticsArchiveWeekly));

export default router;

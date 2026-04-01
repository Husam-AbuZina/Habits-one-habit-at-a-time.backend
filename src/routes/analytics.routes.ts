import { Router } from "express";
import {
  getAnalyticsArchiveDaily,
  getAnalyticsArchiveDailyGrid,
  getAnalyticsArchiveWeekly,
  getAnalyticsHabitsDaily,
  getAnalyticsHabitsDailyGrid,
  getAnalyticsHabitsWeekly,
  getAnalyticsHabitsWeeklyGrid,
  getAnalyticsSummary,
  getAnalyticsTrendsDaily,
  getAnalyticsTrendsWeekly,
  getHabitDailySeries,
  getHabitHeatmap,
  getHabitStats,
  getHabitWeeklySeries,
} from "../controllers/analytics.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.get("/summary", asyncHandler(getAnalyticsSummary));
router.get("/trends/daily", asyncHandler(getAnalyticsTrendsDaily));
router.get("/trends/weekly", asyncHandler(getAnalyticsTrendsWeekly));
router.get("/habits/daily", asyncHandler(getAnalyticsHabitsDaily));
router.get("/habits/daily/grid", asyncHandler(getAnalyticsHabitsDailyGrid));
router.get("/habits/weekly", asyncHandler(getAnalyticsHabitsWeekly));
router.get("/habits/weekly/grid", asyncHandler(getAnalyticsHabitsWeeklyGrid));
router.get("/archive/daily", asyncHandler(getAnalyticsArchiveDaily));
router.get("/archive/daily/grid", asyncHandler(getAnalyticsArchiveDailyGrid));
router.get("/archive/weekly", asyncHandler(getAnalyticsArchiveWeekly));
router.get("/habits/:habitId/stats", asyncHandler(getHabitStats));
router.get("/habits/:habitId/daily-series", asyncHandler(getHabitDailySeries));
router.get("/habits/:habitId/weekly-series", asyncHandler(getHabitWeeklySeries));
router.get("/habits/:habitId/heatmap", asyncHandler(getHabitHeatmap));

export default router;

import { Router } from "express";
import { getHistoryDaily } from "../controllers/history-daily.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { historyDailySchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.get("/daily", validate(historyDailySchema), asyncHandler(getHistoryDaily));

export default router;

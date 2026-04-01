import { Router } from "express";
import {
  deleteHistoryDay,
  getHistoryDay,
  listHistory,
  patchHistoryDay,
  putHistoryDay,
} from "../controllers/history.controller";
import { validate } from "../middleware/validate";
import {
  historyDaySchema,
  historyRangeSchema,
  patchHistoryDaySchema,
  putHistoryDaySchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });

router.get("/", validate(historyRangeSchema), asyncHandler(listHistory));
router.get("/:date", validate(historyDaySchema), asyncHandler(getHistoryDay));
router.put("/:date", validate(putHistoryDaySchema), asyncHandler(putHistoryDay));
router.patch("/:date", validate(patchHistoryDaySchema), asyncHandler(patchHistoryDay));
router.delete("/:date", validate(historyDaySchema), asyncHandler(deleteHistoryDay));

export default router;

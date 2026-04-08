import { Router } from "express";
import {
  listHistory,
} from "../controllers/history.controller";
import { validate } from "../middleware/validate";
import {
  historyRangeSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });

router.get("/", validate(historyRangeSchema), asyncHandler(listHistory));

export default router;

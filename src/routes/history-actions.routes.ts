import { Router } from "express";
import {
  historyAddDuration,
  historyDecrement,
  historyFill,
  historyIncrement,
  historySkip,
  historyUndo,
  historyUnskip,
  postHabitAction,
} from "../controllers/history-actions.controller";
import { validate } from "../middleware/validate";
import { addDurationSchema, actionSchema, habitDayParamsSchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });

router.post("/increment", validate(habitDayParamsSchema), asyncHandler(historyIncrement));
router.post("/decrement", validate(habitDayParamsSchema), asyncHandler(historyDecrement));
router.post("/fill", validate(habitDayParamsSchema), asyncHandler(historyFill));
router.post("/undo", validate(habitDayParamsSchema), asyncHandler(historyUndo));
router.post("/skip", validate(habitDayParamsSchema), asyncHandler(historySkip));
router.post("/unskip", validate(habitDayParamsSchema), asyncHandler(historyUnskip));
router.post("/add-duration", validate(addDurationSchema), asyncHandler(historyAddDuration));

export const actionRouter = Router({ mergeParams: true });
actionRouter.post("/", validate(actionSchema), asyncHandler(postHabitAction));

export default router;

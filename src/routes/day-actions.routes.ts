import { Router } from "express";
import {
  addFiveToDay,
  addToDay,
  decrementDay,
  incrementDay,
  resetDay,
  skipDay,
  undoDay,
  unskipDay,
} from "../controllers/day-actions.controller";
import { validate } from "../middleware/validate";
import {
  addAmountSchema,
  habitDayParamsSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });

router.post("/increment", validate(habitDayParamsSchema), asyncHandler(incrementDay));
router.post("/decrement", validate(habitDayParamsSchema), asyncHandler(decrementDay));
router.post("/add", validate(addAmountSchema), asyncHandler(addToDay));
router.post("/add-five", validate(habitDayParamsSchema), asyncHandler(addFiveToDay));
router.post("/reset", validate(habitDayParamsSchema), asyncHandler(resetDay));
router.post("/undo", validate(habitDayParamsSchema), asyncHandler(undoDay));
router.post("/skip", validate(habitDayParamsSchema), asyncHandler(skipDay));
router.post("/unskip", validate(habitDayParamsSchema), asyncHandler(unskipDay));

export default router;

import { Router } from "express";
import {
  deleteDescription,
  getDescription,
  putDescription,
} from "../controllers/description.controller";
import { validate } from "../middleware/validate";
import { descriptionSchema, habitIdSchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });

router.get("/", validate(habitIdSchema), asyncHandler(getDescription));
router.put(
  "/",
  validate(habitIdSchema),
  validate(descriptionSchema),
  asyncHandler(putDescription),
);
router.delete("/", validate(habitIdSchema), asyncHandler(deleteDescription));

export default router;

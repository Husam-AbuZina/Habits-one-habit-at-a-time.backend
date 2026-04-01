import { Router } from "express";
import {
  addHabitToList,
  createList,
  deleteList,
  listLists,
  removeHabitFromList,
  updateList,
} from "../controllers/lists.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  habitListParamsSchema,
  listCreateSchema,
  listIdSchema,
  updateListSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(listLists));
router.post("/", validate(listCreateSchema), asyncHandler(createList));
router.patch("/:listId", validate(updateListSchema), asyncHandler(updateList));
router.delete("/:listId", validate(listIdSchema), asyncHandler(deleteList));
router.post("/habits/:habitId/lists/:listId", validate(habitListParamsSchema), asyncHandler(addHabitToList));
router.delete("/habits/:habitId/lists/:listId", validate(habitListParamsSchema), asyncHandler(removeHabitFromList));

export default router;

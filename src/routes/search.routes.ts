import { Router } from "express";
import { getHabitTemplateCategories, getHabitTemplates, searchHabits } from "../controllers/search.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { habitSearchSchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.get("/habits/search", validate(habitSearchSchema), asyncHandler(searchHabits));
router.get("/habit-templates", asyncHandler(getHabitTemplates));
router.get("/habit-templates/categories", asyncHandler(getHabitTemplateCategories));

export default router;

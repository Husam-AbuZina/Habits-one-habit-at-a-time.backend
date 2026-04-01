import { Router } from "express";
import { deleteMe, getMe, updateMe } from "../controllers/me.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateMeSchema } from "../schemas/auth.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getMe));
router.patch("/", validate(updateMeSchema), asyncHandler(updateMe));
router.delete("/", asyncHandler(deleteMe));

export default router;

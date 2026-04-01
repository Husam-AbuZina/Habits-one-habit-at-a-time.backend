import { Router } from "express";
import { getSync, pushSync } from "../controllers/sync.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { syncPushSchema, syncSchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.get("/", validate(syncSchema), asyncHandler(getSync));
router.post("/push", validate(syncPushSchema), asyncHandler(pushSync));

export default router;

import { Router } from "express";
import { pullSnapshot, pushSnapshot } from "../controllers/sync.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { syncPushSchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.get("/pull", asyncHandler(pullSnapshot));
router.post("/push", validate(syncPushSchema), asyncHandler(pushSnapshot));

export default router;

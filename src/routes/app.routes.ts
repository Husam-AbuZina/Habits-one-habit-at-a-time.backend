import { Router } from "express";
import { getBootstrap } from "../controllers/bootstrap.controller";
import { getHealth } from "../controllers/health.controller";
import { getSummaryCounters } from "../controllers/settings.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.get("/health", getHealth);
router.get("/bootstrap", requireAuth, asyncHandler(getBootstrap));
router.get("/me/summary", requireAuth, asyncHandler(getSummaryCounters));

export default router;

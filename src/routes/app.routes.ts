import { Router } from "express";
import { getBootstrap } from "../controllers/bootstrap.controller";
import { getHealth } from "../controllers/health.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.get("/health", getHealth);
router.get("/bootstrap", requireAuth, asyncHandler(getBootstrap));

export default router;

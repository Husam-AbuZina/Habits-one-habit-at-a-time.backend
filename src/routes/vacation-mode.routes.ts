import { Router } from "express";
import { disableVacationMode, enableVacationMode, getVacationMode } from "../controllers/vacation-mode.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(getVacationMode));
router.post("/enable", asyncHandler(enableVacationMode));
router.post("/disable", asyncHandler(disableVacationMode));

export default router;

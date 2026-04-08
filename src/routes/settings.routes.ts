import { Router } from "express";
import {
  getSettings,
  patchSettings,
} from "../controllers/settings.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateSettingsSchema } from "../schemas/settings.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getSettings));
router.patch("/", validate(updateSettingsSchema), asyncHandler(patchSettings));

export default router;

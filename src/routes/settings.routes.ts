import { Router } from "express";
import {
  getSettings,
  patchAppearance,
  patchCompletionSound,
  patchFailureSound,
  patchNotificationSound,
  patchSettings,
  patchSounds,
  patchVacationMode,
  patchWeekStart,
} from "../controllers/settings.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  updateAppearanceSchema,
  updateCompletionSoundSchema,
  updateFailureSoundSchema,
  updateNotificationSoundSchema,
  updateSettingsSchema,
  updateSoundsEnabledSchema,
  updateVacationModeSchema,
  updateWeekStartSchema,
} from "../schemas/settings.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getSettings));
router.patch("/", validate(updateSettingsSchema), asyncHandler(patchSettings));
router.patch("/appearance", validate(updateAppearanceSchema), asyncHandler(patchAppearance));
router.patch("/sounds", validate(updateSoundsEnabledSchema), asyncHandler(patchSounds));
router.patch(
  "/vacation-mode",
  validate(updateVacationModeSchema),
  asyncHandler(patchVacationMode),
);
router.patch("/week-start", validate(updateWeekStartSchema), asyncHandler(patchWeekStart));
router.patch(
  "/sounds/completion",
  validate(updateCompletionSoundSchema),
  asyncHandler(patchCompletionSound),
);
router.patch(
  "/sounds/failure",
  validate(updateFailureSoundSchema),
  asyncHandler(patchFailureSound),
);
router.patch(
  "/sounds/notification",
  validate(updateNotificationSoundSchema),
  asyncHandler(patchNotificationSound),
);

export default router;

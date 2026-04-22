import { Router } from "express";
import {
  deleteDeviceController,
  getNotificationPreferences,
  listDevices,
  patchNotificationPreferences,
  registerDeviceController,
  testNotification,
  unregisterDeviceController,
  updateDeviceController,
} from "../controllers/notifications.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  deviceIdSchema,
  notificationPrefsSchema,
  registerDeviceSchema,
  testNotificationSchema,
  unregisterDeviceSchema,
  updateDeviceSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);

router.get("/devices", asyncHandler(listDevices));
router.post("/devices/register", validate(registerDeviceSchema), asyncHandler(registerDeviceController));
router.post(
  "/devices/unregister",
  validate(unregisterDeviceSchema),
  asyncHandler(unregisterDeviceController),
);
router.patch("/devices/:deviceId", validate(updateDeviceSchema), asyncHandler(updateDeviceController));
router.delete("/devices/:deviceId", validate(deviceIdSchema), asyncHandler(deleteDeviceController));

router.get("/notifications/preferences", asyncHandler(getNotificationPreferences));
router.patch(
  "/notifications/preferences",
  validate(notificationPrefsSchema),
  asyncHandler(patchNotificationPreferences),
);
router.post("/notifications/test", validate(testNotificationSchema), asyncHandler(testNotification));

export default router;

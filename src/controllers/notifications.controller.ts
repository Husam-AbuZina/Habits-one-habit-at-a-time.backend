import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ensureUserSettings } from "../services/settings.service";
import {
  deleteDevice,
  listDevicesForUser,
  registerDevice,
  sendPushToUser,
  unregisterDevice,
  updateDevice,
} from "../services/push.service";
import { ApiError } from "../utils/api-error";

const serializePreferences = (settings: {
  notificationsEnabled?: boolean;
  reminderNotificationsEnabled?: boolean;
  marketingNotificationsEnabled?: boolean;
  soundsEnabled?: boolean;
  notificationSoundId?: string;
  appBadgeEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}) => ({
  notificationsEnabled: settings.notificationsEnabled ?? true,
  reminderNotificationsEnabled: settings.reminderNotificationsEnabled ?? true,
  marketingNotificationsEnabled: settings.marketingNotificationsEnabled ?? false,
  soundsEnabled: settings.soundsEnabled ?? true,
  notificationSoundId: settings.notificationSoundId ?? null,
  appBadgeEnabled: settings.appBadgeEnabled ?? false,
  quietHoursEnabled: settings.quietHoursEnabled ?? false,
  quietHoursStart: settings.quietHoursStart ?? null,
  quietHoursEnd: settings.quietHoursEnd ?? null,
});

export const listDevices = async (req: Request, res: Response) => {
  const devices = await listDevicesForUser(req.auth!.sub);
  res.json({ devices });
};

export const registerDeviceController = async (req: Request, res: Response) => {
  const device = await registerDevice(req.auth!.sub, req.body);
  res.status(StatusCodes.CREATED).json({ device });
};

export const updateDeviceController = async (req: Request, res: Response) => {
  const device = await updateDevice(req.auth!.sub, String(req.params.deviceId), req.body);

  if (!device) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Device not found");
  }

  res.json({ device });
};

export const unregisterDeviceController = async (req: Request, res: Response) => {
  await unregisterDevice(req.auth!.sub, req.body.token);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const deleteDeviceController = async (req: Request, res: Response) => {
  await deleteDevice(req.auth!.sub, String(req.params.deviceId));
  res.status(StatusCodes.NO_CONTENT).send();
};

export const getNotificationPreferences = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);
  res.json({ preferences: serializePreferences(settings) });
};

export const patchNotificationPreferences = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);
  Object.assign(settings, req.body);
  await settings.save();
  res.json({ preferences: serializePreferences(settings) });
};

export const testNotification = async (req: Request, res: Response) => {
  const result = await sendPushToUser(req.auth!.sub, {
    category: "test",
    title: req.body.title,
    body: req.body.body,
    deepLink: req.body.deepLink ?? null,
    deviceId: req.body.deviceId,
    data: {
      type: "test_notification",
      deepLink: req.body.deepLink ?? "",
    },
  });

  res.json(result);
};

import { SignJWT, importPKCS8 } from "jose";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { DeviceModel } from "../models/device.model";
import { NotificationLogModel } from "../models/notification-log.model";
import { SettingsModel } from "../models/settings.model";
import { ApiError } from "../utils/api-error";

type NotificationCategory = "reminder" | "transactional" | "marketing" | "system" | "test";

type PushPayload = {
  title: string;
  body: string;
  category: NotificationCategory;
  data?: Record<string, string>;
  deepLink?: string | null;
  deviceId?: string;
};

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

const hasFcmConfig = () =>
  Boolean(env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY);

const normalizePrivateKey = (value: string) => value.replace(/\\n/g, "\n");

const toSeconds = () => Math.floor(Date.now() / 1000);

const isQuietHoursBlocked = (
  timezone: string | null | undefined,
  quietHoursEnabled: boolean | undefined,
  quietHoursStart: string | null | undefined,
  quietHoursEnd: string | null | undefined,
) => {
  if (!quietHoursEnabled || !quietHoursStart || !quietHoursEnd) return false;

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone || "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const current = formatter.format(new Date());

  if (quietHoursStart < quietHoursEnd) {
    return current >= quietHoursStart && current < quietHoursEnd;
  }

  return current >= quietHoursStart || current < quietHoursEnd;
};

const getGoogleAccessToken = async () => {
  if (!hasFcmConfig()) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      "FCM credentials are not configured on the server",
    );
  }

  const privateKey = await importPKCS8(normalizePrivateKey(env.FCM_PRIVATE_KEY!), "RS256");
  const now = toSeconds();
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(env.FCM_CLIENT_EMAIL!)
    .setSubject(env.FCM_CLIENT_EMAIL!)
    .setAudience(GOOGLE_OAUTH_TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const json = (await response.json()) as { access_token?: string; error?: string };

  if (!response.ok || !json.access_token) {
    throw new ApiError(StatusCodes.BAD_GATEWAY, "Failed to obtain Firebase access token", json);
  }

  return json.access_token;
};

const parseFcmError = (details: unknown) => {
  const detailList = Array.isArray(details) ? details : [];
  const text = JSON.stringify(details ?? {});
  const isInvalid = text.includes("UNREGISTERED") || text.includes("registration-token-not-registered");

  return {
    isInvalid,
    raw: detailList,
  };
};

const markDeviceInvalid = async (deviceId: string, reason: string) => {
  await DeviceModel.findByIdAndUpdate(deviceId, {
    $set: {
      isActive: false,
      invalidatedAt: new Date(),
      invalidationReason: reason,
    },
  });
};

const shouldSendByCategory = (
  settings: {
    notificationsEnabled?: boolean;
    reminderNotificationsEnabled?: boolean;
    marketingNotificationsEnabled?: boolean;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  } | null,
  timezone: string | null | undefined,
  category: NotificationCategory,
) => {
  if (!settings?.notificationsEnabled) return false;
  if (category === "reminder" && settings.reminderNotificationsEnabled === false) return false;
  if (category === "marketing" && settings.marketingNotificationsEnabled !== true) return false;
  if (
    category !== "transactional" &&
    isQuietHoursBlocked(
      timezone,
      settings?.quietHoursEnabled,
      settings?.quietHoursStart,
      settings?.quietHoursEnd,
    )
  ) {
    return false;
  }

  return true;
};

export const registerDevice = async (
  userId: string,
  input: {
    token: string;
    platform: "android" | "ios" | "web";
    appVersion?: string;
    timezone?: string;
    language?: string;
    deviceName?: string;
    notificationPermission?: "granted" | "denied" | "provisional" | "not_determined";
  },
) => {
  const now = new Date();

  const device = await DeviceModel.findOneAndUpdate(
    { token: input.token },
    {
      $set: {
        userId,
        platform: input.platform,
        appVersion: input.appVersion ?? null,
        timezone: input.timezone ?? null,
        language: input.language ?? null,
        deviceName: input.deviceName ?? null,
        notificationPermission: input.notificationPermission ?? "granted",
        isActive: true,
        invalidatedAt: null,
        invalidationReason: null,
        lastSeenAt: now,
        lastRegisteredAt: now,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return device;
};

export const listDevicesForUser = async (userId: string) =>
  DeviceModel.find({ userId }).sort({ updatedAt: -1 });

export const unregisterDevice = async (userId: string, token: string) => {
  await DeviceModel.findOneAndUpdate(
    { userId, token },
    {
      $set: {
        isActive: false,
        invalidatedAt: new Date(),
        invalidationReason: "client_unregister",
      },
    },
  );
};

export const updateDevice = async (
  userId: string,
  deviceId: string,
  input: Record<string, unknown>,
) =>
  DeviceModel.findOneAndUpdate(
    { _id: deviceId, userId },
    {
      $set: {
        ...input,
        lastSeenAt: new Date(),
        ...(input.isActive === true ? { invalidatedAt: null, invalidationReason: null } : {}),
      },
    },
    { new: true },
  );

export const deleteDevice = async (userId: string, deviceId: string) => {
  await DeviceModel.deleteOne({ _id: deviceId, userId });
};

export const sendPushToUser = async (userId: string, payload: PushPayload) => {
  const [settings, devices] = await Promise.all([
    SettingsModel.findOne({ userId }),
    DeviceModel.find({
      userId,
      isActive: true,
      ...(payload.deviceId ? { _id: payload.deviceId } : {}),
    }),
  ]);

  if (devices.length === 0) {
    return {
      attempted: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      results: [],
    };
  }

  const accessToken = await getGoogleAccessToken();
  const endpoint = `https://fcm.googleapis.com/v1/projects/${env.FCM_PROJECT_ID}/messages:send`;

  const results = await Promise.all(
    devices.map(async (device) => {
      if (
        device.notificationPermission === "denied" ||
        !shouldSendByCategory(settings, device.timezone as string | null | undefined, payload.category)
      ) {
        const log = await NotificationLogModel.create({
          userId,
          deviceId: device._id,
          token: device.token,
          category: payload.category,
          title: payload.title,
          body: payload.body,
          deepLink: payload.deepLink ?? null,
          data: payload.data,
          status: "failed",
          errorCode: "SKIPPED_BY_PREFERENCES",
          errorMessage: "Notification skipped because of preferences or permission state.",
        });

        return { ok: false, skipped: true, logId: String(log._id) };
      }

      const message = {
        message: {
          token: device.token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            ...(payload.data ?? {}),
            category: payload.category,
            deepLink: payload.deepLink ?? "",
          },
          android: {
            priority: payload.category === "reminder" ? "high" : "normal",
            notification: {
              channelId:
                payload.category === "reminder"
                  ? "reminders"
                  : payload.category === "marketing"
                    ? "promotions"
                    : "updates",
            },
          },
          apns: {
            headers: {
              "apns-priority": payload.category === "reminder" ? "10" : "5",
            },
            payload: {
              aps: {
                sound: settings?.soundsEnabled ? (settings.notificationSoundId as string) || "default" : undefined,
              },
            },
          },
        },
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (response.ok) {
        const log = await NotificationLogModel.create({
          userId,
          deviceId: device._id,
          token: device.token,
          category: payload.category,
          title: payload.title,
          body: payload.body,
          deepLink: payload.deepLink ?? null,
          data: payload.data,
          status: "sent",
          providerMessageId: typeof body.name === "string" ? body.name : null,
          sentAt: new Date(),
        });

        return { ok: true, skipped: false, logId: String(log._id) };
      }

      const parsed = parseFcmError((body.error as { details?: unknown })?.details);

      if (parsed.isInvalid) {
        await markDeviceInvalid(String(device._id), "fcm_unregistered");
      }

      const log = await NotificationLogModel.create({
        userId,
        deviceId: device._id,
        token: device.token,
        category: payload.category,
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink ?? null,
        data: payload.data,
        status: parsed.isInvalid ? "invalid" : "failed",
        errorCode:
          typeof (body.error as { status?: unknown })?.status === "string"
            ? ((body.error as { status: string }).status)
            : "FCM_SEND_FAILED",
        errorMessage:
          typeof (body.error as { message?: unknown })?.message === "string"
            ? ((body.error as { message: string }).message)
            : "Firebase rejected the push request.",
      });

      return { ok: false, skipped: false, logId: String(log._id) };
    }),
  );

  return {
    attempted: results.length,
    sent: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok && !item.skipped).length,
    skipped: results.filter((item) => item.skipped).length,
    results,
  };
};

export const sendHabitReminderNotification = async (
  userId: string,
  habitTitle: string,
  deepLink?: string,
) =>
  sendPushToUser(userId, {
    category: "reminder",
    title: "Time to log your habit",
    body: habitTitle,
    deepLink: deepLink ?? null,
    data: {
      habitTitle,
      type: "habit_reminder",
    },
  });

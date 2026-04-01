import { z } from "zod";

const settingsPatchBody = z.object({
  appearanceLabel: z.string().trim().min(1).max(50).optional(),
  soundsEnabled: z.boolean().optional(),
  vibrationEnabled: z.boolean().optional(),
  vacationModeEnabled: z.boolean().optional(),
  weekStartsOn: z.enum(["sunday", "monday"]).optional(),
  completionSoundId: z.string().trim().min(1).max(100).optional(),
  failureSoundId: z.string().trim().min(1).max(100).optional(),
  notificationSoundId: z.string().trim().min(1).max(100).optional(),
  sortCompletedMode: z.string().trim().min(1).max(50).optional(),
  sortSkippedMode: z.string().trim().min(1).max(50).optional(),
  appBadgeEnabled: z.boolean().optional(),
  widgetAction: z.string().trim().min(1).max(50).optional(),
  healthUnits: z.string().trim().min(1).max(50).optional(),
  startOfDay: z.string().trim().min(1).max(10).optional(),
  notificationsEnabled: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  body: settingsPatchBody.refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  }),
});

export const updateAppearanceSchema = z.object({
  body: z.object({
    appearanceLabel: z.string().trim().min(1).max(50),
  }),
});

export const updateSoundsEnabledSchema = z.object({
  body: z.object({
    soundsEnabled: z.boolean(),
  }),
});

export const updateVacationModeSchema = z.object({
  body: z.object({
    vacationModeEnabled: z.boolean(),
  }),
});

export const updateWeekStartSchema = z.object({
  body: z.object({
    weekStartsOn: z.enum(["sunday", "monday"]),
  }),
});

export const updateCompletionSoundSchema = z.object({
  body: z.object({
    completionSoundId: z.string().trim().min(1).max(100),
  }),
});

export const updateFailureSoundSchema = z.object({
  body: z.object({
    failureSoundId: z.string().trim().min(1).max(100),
  }),
});

export const updateNotificationSoundSchema = z.object({
  body: z.object({
    notificationSoundId: z.string().trim().min(1).max(100),
  }),
});

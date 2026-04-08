import { z } from "zod";

const settingsPatchBody = z.object({
  appearanceMode: z.string().trim().min(1).max(50).optional(),
  appIconMode: z.string().trim().min(1).max(50).optional(),
  language: z.string().trim().min(1).max(50).optional(),
  soundsEnabled: z.boolean().optional(),
  completionSoundId: z.string().trim().min(1).max(100).optional(),
  failureSoundId: z.string().trim().min(1).max(100).optional(),
  notificationSoundId: z.string().trim().min(1).max(100).optional(),
  weekStartsOn: z.enum(["sunday", "monday"]).optional(),
  sortCompletedMode: z.string().trim().min(1).max(50).optional(),
  sortSkippedMode: z.string().trim().min(1).max(50).optional(),
  appBadgeEnabled: z.boolean().optional(),
  includeDailyInBadge: z.boolean().optional(),
  includeWeeklyInBadge: z.boolean().optional(),
  includeMonthlyInBadge: z.boolean().optional(),
  widgetActionMode: z.string().trim().min(1).max(50).optional(),
  distanceUnit: z.string().trim().min(1).max(50).optional(),
  volumeUnit: z.string().trim().min(1).max(50).optional(),
  startOfDay: z.string().trim().min(1).max(10).optional(),
  vacationModeEnabled: z.boolean().optional(),
  vacationModeScope: z.string().trim().min(1).max(50).optional(),
  vacationModeHabitIds: z.array(z.string().min(1)).optional(),
});

export const updateSettingsSchema = z.object({
  body: settingsPatchBody.refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  }),
});

export const updateAppearanceSchema = z.object({
  body: z.object({
    appearanceMode: z.string().trim().min(1).max(50),
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
    vacationModeScope: z.string().trim().min(1).max(50).optional(),
    vacationModeHabitIds: z.array(z.string().min(1)).optional(),
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

import { Schema, model } from "mongoose";
import { DEFAULT_SETTINGS } from "../constants/settings";

const settingsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    appearanceMode: {
      type: String,
      default: DEFAULT_SETTINGS.appearanceMode,
    },
    appIconMode: {
      type: String,
      default: DEFAULT_SETTINGS.appIconMode,
    },
    language: {
      type: String,
      default: DEFAULT_SETTINGS.language,
    },
    notificationsEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.notificationsEnabled,
    },
    reminderNotificationsEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.reminderNotificationsEnabled,
    },
    marketingNotificationsEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.marketingNotificationsEnabled,
    },
    soundsEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.soundsEnabled,
    },
    completionSoundId: {
      type: String,
      default: DEFAULT_SETTINGS.completionSoundId,
    },
    failureSoundId: {
      type: String,
      default: DEFAULT_SETTINGS.failureSoundId,
    },
    notificationSoundId: {
      type: String,
      default: DEFAULT_SETTINGS.notificationSoundId,
    },
    weekStartsOn: {
      type: String,
      enum: ["sunday", "monday"],
      default: DEFAULT_SETTINGS.weekStartsOn,
    },
    sortCompletedMode: {
      type: String,
      default: DEFAULT_SETTINGS.sortCompletedMode,
    },
    sortSkippedMode: {
      type: String,
      default: DEFAULT_SETTINGS.sortSkippedMode,
    },
    appBadgeEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.appBadgeEnabled,
    },
    includeDailyInBadge: {
      type: Boolean,
      default: DEFAULT_SETTINGS.includeDailyInBadge,
    },
    includeWeeklyInBadge: {
      type: Boolean,
      default: DEFAULT_SETTINGS.includeWeeklyInBadge,
    },
    includeMonthlyInBadge: {
      type: Boolean,
      default: DEFAULT_SETTINGS.includeMonthlyInBadge,
    },
    quietHoursEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.quietHoursEnabled,
    },
    quietHoursStart: {
      type: String,
      default: DEFAULT_SETTINGS.quietHoursStart,
    },
    quietHoursEnd: {
      type: String,
      default: DEFAULT_SETTINGS.quietHoursEnd,
    },
    widgetActionMode: {
      type: String,
      default: DEFAULT_SETTINGS.widgetActionMode,
    },
    distanceUnit: {
      type: String,
      default: DEFAULT_SETTINGS.distanceUnit,
    },
    volumeUnit: {
      type: String,
      default: DEFAULT_SETTINGS.volumeUnit,
    },
    startOfDay: {
      type: String,
      default: DEFAULT_SETTINGS.startOfDay,
    },
    vacationModeEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.vacationModeEnabled,
    },
    vacationModeScope: {
      type: String,
      default: DEFAULT_SETTINGS.vacationModeScope,
    },
    vacationModeHabitIds: {
      type: [Schema.Types.ObjectId],
      ref: "Habit",
      default: DEFAULT_SETTINGS.vacationModeHabitIds,
    },
  },
  {
    timestamps: true,
  },
);

export const SettingsModel = model("Settings", settingsSchema);

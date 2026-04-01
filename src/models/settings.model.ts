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
    appearanceLabel: {
      type: String,
      default: DEFAULT_SETTINGS.appearanceLabel,
    },
    soundsEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.soundsEnabled,
    },
    vibrationEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.vibrationEnabled,
    },
    vacationModeEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.vacationModeEnabled,
    },
    weekStartsOn: {
      type: String,
      enum: ["sunday", "monday"],
      default: DEFAULT_SETTINGS.weekStartsOn,
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
    widgetAction: {
      type: String,
      default: DEFAULT_SETTINGS.widgetAction,
    },
    healthUnits: {
      type: String,
      default: DEFAULT_SETTINGS.healthUnits,
    },
    startOfDay: {
      type: String,
      default: DEFAULT_SETTINGS.startOfDay,
    },
    notificationsEnabled: {
      type: Boolean,
      default: DEFAULT_SETTINGS.notificationsEnabled,
    },
  },
  {
    timestamps: true,
  },
);

export const SettingsModel = model("Settings", settingsSchema);

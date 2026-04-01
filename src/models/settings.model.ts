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
  },
  {
    timestamps: true,
  },
);

export const SettingsModel = model("Settings", settingsSchema);

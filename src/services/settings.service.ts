import { DEFAULT_SETTINGS } from "../constants/settings";
import { SettingsModel } from "../models/settings.model";

export const ensureUserSettings = async (userId: string) => {
  let settings = await SettingsModel.findOne({ userId });

  if (!settings) {
    settings = await SettingsModel.create({
      userId,
      ...DEFAULT_SETTINGS,
    });
  }

  return settings;
};

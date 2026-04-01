import type { Request, Response } from "express";
import { ensureUserSettings } from "../services/settings.service";

export const getVacationMode = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);
  res.json({ enabled: settings.vacationModeEnabled });
};
export const enableVacationMode = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);
  settings.vacationModeEnabled = true;
  await settings.save();
  res.json({ enabled: true });
};
export const disableVacationMode = async (req: Request, res: Response) => {
  const settings = await ensureUserSettings(req.auth!.sub);
  settings.vacationModeEnabled = false;
  await settings.save();
  res.json({ enabled: false });
};

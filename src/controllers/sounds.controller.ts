import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { SOUND_CATALOG } from "../constants/sounds";
import { ApiError } from "../utils/api-error";

const findSound = (soundId: string) => SOUND_CATALOG.find((sound) => sound.id === soundId);

export const listSounds = (_req: Request, res: Response) => {
  res.json({
    sounds: {
      completion: SOUND_CATALOG.filter((sound) => sound.category === "completion"),
      failure: SOUND_CATALOG.filter((sound) => sound.category === "failure"),
      notification: SOUND_CATALOG.filter((sound) => sound.category === "notification"),
    },
    total: SOUND_CATALOG.length,
  });
};

export const getSound = (req: Request, res: Response) => {
  const sound = findSound(String(req.params.soundId));

  if (!sound) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Sound not found");
  }

  res.json({ sound });
};

export const previewSound = (req: Request, res: Response) => {
  const sound = findSound(String(req.params.soundId));

  if (!sound) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Sound not found");
  }

  console.info("sound.preview", {
    soundId: sound.id,
    category: sound.category,
    timestamp: new Date().toISOString(),
    userAgent: req.get("user-agent") ?? null,
  });

  res.status(StatusCodes.ACCEPTED).json({
    accepted: true,
    sound,
    loggedAt: new Date().toISOString(),
  });
};

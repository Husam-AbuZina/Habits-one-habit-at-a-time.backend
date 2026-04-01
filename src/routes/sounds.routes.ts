import { Router } from "express";
import { getSound, listSounds, previewSound } from "../controllers/sounds.controller";
import { validate } from "../middleware/validate";
import { soundIdSchema } from "../schemas/habit.schema";

const router = Router();

router.get("/", listSounds);
router.get("/:soundId", validate(soundIdSchema), getSound);
router.post("/:soundId/preview", validate(soundIdSchema), previewSound);

export default router;

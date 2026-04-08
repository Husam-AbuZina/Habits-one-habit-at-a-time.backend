import { Router } from "express";
import {
  appleAuth,
  googleAuth,
  refresh,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import {
  appleAuthSchema,
  googleAuthSchema,
  refreshSchema,
} from "../schemas/auth.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post("/refresh", validate(refreshSchema), asyncHandler(refresh));
router.post("/apple", validate(appleAuthSchema), asyncHandler(appleAuth));
router.post("/google", validate(googleAuthSchema), asyncHandler(googleAuth));

export default router;

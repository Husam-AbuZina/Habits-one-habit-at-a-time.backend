import { Router } from "express";
import {
  appleAuth,
  deleteMe,
  getMe,
  googleAuth,
  login,
  logout,
  refresh,
  register,
  updateMe,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  socialAuthSchema,
  updateMeSchema,
} from "../schemas/auth.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.post("/refresh", validate(refreshSchema), asyncHandler(refresh));
router.post("/apple", validate(socialAuthSchema), asyncHandler(appleAuth));
router.post("/google", validate(socialAuthSchema), asyncHandler(googleAuth));
router.get("/me", requireAuth, asyncHandler(getMe));
router.patch("/me", requireAuth, validate(updateMeSchema), asyncHandler(updateMe));
router.delete("/me", requireAuth, asyncHandler(deleteMe));

export default router;

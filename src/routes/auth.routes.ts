import { Router } from "express";
import {
  deleteMe,
  getMe,
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
  updateMeSchema,
} from "../schemas/auth.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.post("/refresh", validate(refreshSchema), asyncHandler(refresh));
router.get("/me", requireAuth, asyncHandler(getMe));
router.patch("/me", requireAuth, validate(updateMeSchema), asyncHandler(updateMe));
router.delete("/me", requireAuth, asyncHandler(deleteMe));

export default router;

import { Router } from "express";
import {
  getHomeByQuery,
  getHomeWeekByQuery,
} from "../controllers/home.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getHomeByQuery));
router.get("/week", asyncHandler(getHomeWeekByQuery));

export default router;

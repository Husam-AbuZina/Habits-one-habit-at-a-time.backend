import { Router } from "express";
import { getVersion } from "../controllers/version.controller";

const router = Router();
router.get("/version", getVersion);

export default router;

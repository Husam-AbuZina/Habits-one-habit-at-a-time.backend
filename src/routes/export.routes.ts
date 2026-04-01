import { Router } from "express";
import { createBackup, exportCsv, exportJson, importJson, restoreBackup } from "../controllers/export.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { importJsonSchema } from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.get("/export/csv", asyncHandler(exportCsv));
router.get("/export/json", asyncHandler(exportJson));
router.post("/import/json", validate(importJsonSchema), asyncHandler(importJson));
router.post("/backup/create", asyncHandler(createBackup));
router.post("/backup/restore", validate(importJsonSchema), asyncHandler(restoreBackup));

export default router;

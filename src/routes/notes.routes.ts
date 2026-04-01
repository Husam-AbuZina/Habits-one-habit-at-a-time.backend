import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "../controllers/notes.controller";
import { validate } from "../middleware/validate";
import {
  createNoteSchema,
  listNotesSchema,
  noteIdSchema,
  updateNoteSchema,
} from "../schemas/habit.schema";
import { asyncHandler } from "../utils/async-handler";

const router = Router({ mergeParams: true });

router.get("/", validate(listNotesSchema), asyncHandler(listNotes));
router.post("/", validate(createNoteSchema), asyncHandler(createNote));
router.get("/:noteId", validate(noteIdSchema), asyncHandler(getNote));
router.patch("/:noteId", validate(updateNoteSchema), asyncHandler(updateNote));
router.delete("/:noteId", validate(noteIdSchema), asyncHandler(deleteNote));

export default router;

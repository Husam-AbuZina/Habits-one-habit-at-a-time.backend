import { Schema, model } from "mongoose";

const noteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

noteSchema.index({ userId: 1, habitId: 1, date: -1, createdAt: -1 });

export const NoteModel = model("Note", noteSchema);

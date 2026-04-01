import { Schema, model } from "mongoose";

const habitHistoryEntrySchema = new Schema(
  {
    date: {
      type: String,
      required: true,
    },
    completedCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["undone", "partial", "done"],
      default: "undone",
    },
    isSkipped: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const habitHistorySchema = new Schema(
  {
    createdAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    entries: {
      type: [habitHistoryEntrySchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const habitSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    emoji: {
      type: String,
      default: null,
    },
    goalCount: {
      type: Number,
      required: true,
      min: 0,
    },
    previousCompletedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    iconKey: {
      type: String,
      default: null,
    },
    colorValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    schedule: {
      type: Schema.Types.Mixed,
      default: null,
    },
    notes: {
      type: [String],
      default: [],
    },
    intent: {
      type: String,
      enum: ["build", "break"],
      required: true,
    },
    goalFrequency: {
      type: String,
      default: "daily",
    },
    repeatMode: {
      type: String,
      default: "schedule",
    },
    remindMe: {
      type: Schema.Types.Mixed,
      default: null,
    },
    unitType: {
      type: String,
      enum: ["count", "minutes", "custom"],
      default: "count",
    },
    customUnit: {
      type: String,
      default: null,
    },
    allowsOverflow: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    isTimerRunning: {
      type: Boolean,
      default: false,
    },
    timer: {
      type: {
        isRunning: {
          type: Boolean,
          default: false,
        },
        isPaused: {
          type: Boolean,
          default: false,
        },
        startedAt: {
          type: Date,
          default: null,
        },
        pausedAt: {
          type: Date,
          default: null,
        },
        accumulatedSeconds: {
          type: Number,
          default: 0,
          min: 0,
        },
        activeDate: {
          type: String,
          default: null,
        },
      },
      default: () => ({
        isRunning: false,
        isPaused: false,
        startedAt: null,
        pausedAt: null,
        accumulatedSeconds: 0,
        activeDate: null,
      }),
    },
    skippedAt: {
      type: Date,
      default: null,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    listIds: {
      type: [Schema.Types.ObjectId],
      ref: "List",
      default: [],
    },
    history: {
      type: habitHistorySchema,
      required: true,
      default: () => ({
        createdAt: new Date(),
        entries: [],
      }),
    },
  },
  {
    timestamps: true,
  },
);

habitSchema.index({ userId: 1, isArchived: 1, order: 1 });

export const HabitModel = model("Habit", habitSchema);

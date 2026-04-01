import { z } from "zod";

const scheduleSchema = z.record(z.string(), z.unknown()).nullable().optional();
const remindMeSchema = z
  .union([z.boolean(), z.record(z.string(), z.unknown()), z.null()])
  .optional();

const habitBodyBase = {
  title: z.string().trim().min(1).max(140),
  emoji: z.string().trim().min(1).max(16).nullable().optional(),
  goalCount: z.number().nonnegative(),
  previousCompletedCount: z.number().nonnegative().optional(),
  iconKey: z.string().trim().min(1).max(80).nullable().optional(),
  colorValue: z.union([z.string(), z.number()]).nullable().optional(),
  schedule: scheduleSchema,
  notes: z.array(z.string().trim().min(1).max(1000)).optional(),
  intent: z.enum(["build", "break"]),
  goalFrequency: z.string().trim().min(1).max(50).optional(),
  repeatMode: z.string().trim().min(1).max(50).optional(),
  remindMe: remindMeSchema,
  unitType: z.enum(["count", "minutes", "custom"]).optional(),
  customUnit: z.string().trim().min(1).max(50).nullable().optional(),
  createdAt: z.string().datetime().optional(),
  allowsOverflow: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isTimerRunning: z.boolean().optional(),
  skippedAt: z.string().datetime().nullable().optional(),
};

export const createHabitSchema = z.object({
  body: z.object(habitBodyBase),
});

export const updateHabitSchema = z.object({
  body: z
    .object({
      title: habitBodyBase.title.optional(),
      emoji: habitBodyBase.emoji,
      goalCount: habitBodyBase.goalCount.optional(),
      previousCompletedCount: habitBodyBase.previousCompletedCount,
      iconKey: habitBodyBase.iconKey,
      colorValue: habitBodyBase.colorValue,
      schedule: habitBodyBase.schedule,
      notes: habitBodyBase.notes,
      intent: habitBodyBase.intent.optional(),
      goalFrequency: habitBodyBase.goalFrequency,
      repeatMode: habitBodyBase.repeatMode,
      remindMe: habitBodyBase.remindMe,
      unitType: habitBodyBase.unitType,
      customUnit: habitBodyBase.customUnit,
      createdAt: habitBodyBase.createdAt,
      allowsOverflow: habitBodyBase.allowsOverflow,
      isArchived: habitBodyBase.isArchived,
      isTimerRunning: habitBodyBase.isTimerRunning,
      skippedAt: habitBodyBase.skippedAt,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

export const listHabitsSchema = z.object({
  query: z.object({
    active: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    archived: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    intent: z.enum(["build", "break"]).optional(),
    date: z.string().datetime().or(z.string().date()).optional(),
    category: z.string().optional(),
  }),
});

export const habitIdSchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
  }),
});

export const reorderHabitsSchema = z.object({
  body: z.object({
    habitIds: z.array(z.string().min(1)).min(1),
  }),
});

export const soundIdSchema = z.object({
  params: z.object({
    soundId: z.string().min(1),
  }),
});

const dateValueSchema = z.string().datetime().or(z.string().date());

const noteBodySchema = z.object({
  content: z.string().trim().min(1).max(4000),
  date: dateValueSchema.optional(),
});

const noteIdParamsSchema = z.object({
  habitId: z.string().min(1),
  noteId: z.string().min(1),
});

const historyEntryBodySchema = z.object({
  completedCount: z.number().nonnegative().optional(),
  status: z.enum(["undone", "partial", "done"]).optional(),
  isSkipped: z.boolean().optional(),
});

export const scheduleValidationSchema = z.object({
  body: z.object({
    date: dateValueSchema,
  }),
});

export const putScheduleSchema = z.object({
  body: z.record(z.string(), z.unknown()).nullable(),
});

export const patchScheduleSchema = z.object({
  body: z
    .record(z.string(), z.unknown())
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" }),
});

export const listNotesSchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
  }),
  query: z.object({
    date: dateValueSchema.optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    page: z.coerce.number().int().positive().optional(),
  }),
});

export const createNoteSchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
  }),
  body: noteBodySchema,
});

export const noteIdSchema = z.object({
  params: noteIdParamsSchema,
});

export const updateNoteSchema = z.object({
  params: z.object(noteIdParamsSchema),
  body: z.object({
    content: z.string().trim().min(1).max(4000),
  }),
});

export const historyRangeSchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
  }),
  query: z.object({
    from: dateValueSchema.optional(),
    to: dateValueSchema.optional(),
  }),
});

export const historyDaySchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
    date: z.string().min(1),
  }),
});

export const putHistoryDaySchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
    date: z.string().min(1),
  }),
  body: z.object({
    completedCount: z.number().nonnegative(),
    status: z.enum(["undone", "partial", "done"]).optional(),
    isSkipped: z.boolean(),
  }),
});

export const patchHistoryDaySchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
    date: z.string().min(1),
  }),
  body: historyEntryBodySchema.refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  }),
});

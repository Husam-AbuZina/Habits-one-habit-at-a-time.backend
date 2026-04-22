import { z } from "zod";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
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
  description: z.string().trim().max(4000).nullable().optional(),
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
  skippedAt: dateOnlySchema.nullable().optional(),
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
      description: habitBodyBase.description,
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
    goalFrequency: z.string().optional(),
    date: dateOnlySchema.optional(),
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

const dateValueSchema = dateOnlySchema;

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
    date: dateOnlySchema,
  }),
});

export const habitDayParamsSchema = historyDaySchema;

export const addAmountSchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
    date: z.string().min(1),
  }),
  body: z.object({
    amount: z.number().positive(),
  }),
});

export const timerStartSchema = z.object({
  body: z.object({
    date: dateOnlySchema.optional(),
    startedAt: z.string().datetime().optional(),
  }),
});

export const timerStopSchema = z.object({
  body: z.object({
    date: dateOnlySchema.optional(),
    durationSeconds: z.number().nonnegative().optional(),
  }),
});

export const timerCancelSchema = z.object({
  body: z.object({
    date: dateOnlySchema.optional(),
  }),
});

export const homeDateSchema = z.object({
  params: z.object({
    date: z.string().min(1),
  }),
  query: z.object({
    includeWeekStrip: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  }),
});

export const homeHabitsQuerySchema = z.object({
  params: z.object({
    date: z.string().min(1),
  }),
  query: z.object({
    includeSkipped: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  }),
});

export const historyAggregateRangeSchema = z.object({
  query: z.object({
    range: z.string().regex(/^\d+d$/i).optional(),
  }),
});

export const listCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    colorValue: z.union([z.string(), z.number()]).nullable().optional(),
  }),
});

export const updateListSchema = z.object({
  params: z.object({
    listId: z.string().min(1),
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      colorValue: z.union([z.string(), z.number()]).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" }),
});

export const listIdSchema = z.object({
  params: z.object({
    listId: z.string().min(1),
  }),
});

export const habitListParamsSchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
    listId: z.string().min(1),
  }),
});

export const remindersQuerySchema = z.object({
  query: z.object({
    habitId: z.string().optional(),
  }),
});

export const createReminderSchema = z.object({
  body: z.object({
    habitId: z.string().optional(),
    title: z.string().trim().min(1).max(160),
    time: z.string().trim().min(1).max(20),
    weekdays: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
  }),
});

export const reminderIdSchema = z.object({
  params: z.object({
    reminderId: z.string().min(1),
  }),
});

export const updateReminderSchema = z.object({
  params: z.object({
    reminderId: z.string().min(1),
  }),
  body: z
    .object({
      title: z.string().trim().min(1).max(160).optional(),
      time: z.string().trim().min(1).max(20).optional(),
      weekdays: z.array(z.string()).optional(),
      enabled: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" }),
});

export const notificationPrefsSchema = z.object({
  body: z
    .object({
      notificationsEnabled: z.boolean().optional(),
      reminderNotificationsEnabled: z.boolean().optional(),
      marketingNotificationsEnabled: z.boolean().optional(),
      soundsEnabled: z.boolean().optional(),
      notificationSoundId: z.string().trim().min(1).max(100).optional(),
      appBadgeEnabled: z.boolean().optional(),
      quietHoursEnabled: z.boolean().optional(),
      quietHoursStart: z.string().trim().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      quietHoursEnd: z.string().trim().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" }),
});

export const registerDeviceSchema = z.object({
  body: z.object({
    token: z.string().trim().min(20).max(4096),
    platform: z.enum(["android", "ios", "web"]),
    appVersion: z.string().trim().max(50).optional(),
    timezone: z.string().trim().max(100).optional(),
    language: z.string().trim().max(50).optional(),
    deviceName: z.string().trim().max(100).optional(),
    notificationPermission: z.enum(["granted", "denied", "provisional", "not_determined"]).optional(),
  }),
});

export const updateDeviceSchema = z.object({
  params: z.object({
    deviceId: z.string().min(1),
  }),
  body: z
    .object({
      token: z.string().trim().min(20).max(4096).optional(),
      appVersion: z.string().trim().max(50).optional(),
      timezone: z.string().trim().max(100).optional(),
      language: z.string().trim().max(50).optional(),
      deviceName: z.string().trim().max(100).optional(),
      isActive: z.boolean().optional(),
      notificationPermission: z.enum(["granted", "denied", "provisional", "not_determined"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" }),
});

export const deviceIdSchema = z.object({
  params: z.object({
    deviceId: z.string().min(1),
  }),
});

export const unregisterDeviceSchema = z.object({
  body: z.object({
    token: z.string().trim().min(20).max(4096),
  }),
});

export const testNotificationSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(120).default("Test notification"),
    body: z.string().trim().min(1).max(240).default("Your push notification setup is working."),
    deepLink: z.string().trim().max(500).optional(),
    deviceId: z.string().min(1).optional(),
  }),
});

export const importJsonSchema = z.object({
  body: z.object({
    settings: z.record(z.string(), z.unknown()).optional(),
    habits: z.array(z.record(z.string(), z.unknown())).optional(),
    notes: z.array(z.record(z.string(), z.unknown())).optional(),
  }),
});

export const descriptionSchema = z.object({
  body: z.object({
    text: z.string().trim().max(4000),
  }),
});

export const habitSearchSchema = z.object({
  query: z.object({
    q: z.string().trim().min(1),
  }),
});

export const streakHabitSchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
  }),
});

export const syncSchema = z.object({
  query: z.object({
    since: z.string().datetime().optional(),
  }),
});

export const syncPushSchema = z.object({
  body: z.object({
    settings: z.record(z.string(), z.unknown()).optional(),
    habits: z.array(z.record(z.string(), z.unknown())).optional(),
    notes: z.array(z.record(z.string(), z.unknown())).optional(),
    reminders: z.array(z.record(z.string(), z.unknown())).optional(),
  }),
});

export const historyDailySchema = z.object({
  query: z.object({
    from: z.string().datetime().or(z.string().date()).optional(),
    to: z.string().datetime().or(z.string().date()).optional(),
  }),
});

export const actionSchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
  }),
  body: z.object({
    date: dateOnlySchema,
    type: z.enum(["increment", "decrement", "fill", "set_value", "undo", "skip", "unskip"]),
    value: z.number().nonnegative().optional(),
  }),
});

export const addDurationSchema = z.object({
  params: z.object({
    habitId: z.string().min(1),
    date: z.string().min(1),
  }),
  body: z.object({
    durationSeconds: z.number().nonnegative(),
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

import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    name: z.string().trim().min(1).max(80).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const updateMeSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(80).optional(),
      email: z.string().email().optional(),
      avatar: z.string().trim().url().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

export const appleAuthSchema = z.object({
  body: z
    .object({
      identityToken: z.string().min(1).optional(),
      firebaseIdToken: z.string().min(1).optional(),
      appInfo: z.record(z.string(), z.unknown()).optional(),
      deviceInfo: z.record(z.string(), z.unknown()).optional(),
      name: z.string().trim().min(1).max(80).optional(),
    })
    .refine((data) => Boolean(data.identityToken || data.firebaseIdToken), {
      message: "Either identityToken or firebaseIdToken is required",
    }),
});

export const googleAuthSchema = z.object({
  body: z
    .object({
      idToken: z.string().min(1).optional(),
      firebaseIdToken: z.string().min(1).optional(),
      appInfo: z.record(z.string(), z.unknown()).optional(),
      deviceInfo: z.record(z.string(), z.unknown()).optional(),
    })
    .refine((data) => Boolean(data.idToken || data.firebaseIdToken), {
      message: "Either idToken or firebaseIdToken is required",
    }),
});

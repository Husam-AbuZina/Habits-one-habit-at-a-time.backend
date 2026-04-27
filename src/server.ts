import "./types/express";
import { app } from "./app";
import { env } from "./config/env";
import { connectToDatabase } from "./db/connect";
import { extractMongoTarget, sanitizeForLog } from "./utils/logging";

process.on("unhandledRejection", (reason) => {
  console.error("[process] Unhandled promise rejection", {
    reason: sanitizeForLog(reason),
  });
});

process.on("uncaughtException", (error) => {
  console.error("[process] Uncaught exception", {
    name: error.name,
    message: error.message,
    stack: error.stack ?? null,
  });
});

const start = async () => {
  console.info("[startup] Starting Habits backend", {
    nodeEnv: env.NODE_ENV,
    nodeVersion: process.version,
    port: env.PORT,
    clientOrigin: env.CLIENT_ORIGIN,
    hasGoogleClientIds: Boolean(env.GOOGLE_CLIENT_IDS),
    hasAppleClientIds: Boolean(env.APPLE_CLIENT_IDS),
    hasFirebaseProjectId: Boolean(env.FIREBASE_PROJECT_ID),
    hasFcmProjectId: Boolean(env.FCM_PROJECT_ID),
    mongoTarget: extractMongoTarget(env.MONGODB_URI),
  });

  await connectToDatabase();

  app.listen(env.PORT, () => {
    console.log(`✅ Habits backend listening on port ${env.PORT}`);
  });
};

void start().catch((error) => {
  console.error("[startup] Failed to start Habits backend", {
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack ?? null : null,
  });
  process.exit(1);
});

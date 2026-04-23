import mongoose from "mongoose";
import { env } from "../config/env";
import { extractMongoTarget } from "../utils/logging";

let listenersRegistered = false;

const registerConnectionListeners = () => {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  mongoose.connection.on("error", (error) => {
    console.error("[db] MongoDB connection error", {
      message: error.message,
      stack: error.stack ?? null,
    });
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.info("[db] MongoDB reconnected");
  });
};

export const connectToDatabase = async () => {
  registerConnectionListeners();

  console.info("[db] Connecting to MongoDB", {
    target: extractMongoTarget(env.MONGODB_URI),
  });

  await mongoose.connect(env.MONGODB_URI);
  console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

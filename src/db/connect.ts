import mongoose, { type ConnectOptions } from "mongoose";
import { env } from "../config/env";
import { extractMongoTarget } from "../utils/logging";

let listenersRegistered = false;

const mongoConnectOptions: ConnectOptions = {
  serverSelectionTimeoutMS: 10_000,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 20_000,
};

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
    options: mongoConnectOptions,
  });

  await mongoose.connect(env.MONGODB_URI, mongoConnectOptions);
  console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

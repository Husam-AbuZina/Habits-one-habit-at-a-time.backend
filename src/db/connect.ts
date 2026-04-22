import mongoose from "mongoose";
import { env } from "../config/env";

export const connectToDatabase = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

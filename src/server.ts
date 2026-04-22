import "./types/express";
import { app } from "./app";
import { env } from "./config/env";
import { connectToDatabase } from "./db/connect";

const start = async () => {
  await connectToDatabase();

  app.listen(env.PORT, () => {
    console.log(`✅ Habits backend listening on port ${env.PORT}`);
  });
};

void start();

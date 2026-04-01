import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import habitsRoutes from "./routes/habits.routes";
import appRoutes from "./routes/app.routes";
import authRoutes from "./routes/auth.routes";
import settingsRoutes from "./routes/settings.routes";
import soundsRoutes from "./routes/sounds.routes";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN === "*" ? true : env.CLIENT_ORIGIN,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/", appRoutes);
app.use("/auth", authRoutes);
app.use("/sounds", soundsRoutes);
app.use("/habits", habitsRoutes);
app.use("/settings", settingsRoutes);

app.use(errorHandler);

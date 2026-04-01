import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import habitsRoutes from "./routes/habits.routes";
import historyAggregateRoutes from "./routes/history-aggregate.routes";
import historyDailyRoutes from "./routes/history-daily.routes";
import homeRoutes from "./routes/home.routes";
import appRoutes from "./routes/app.routes";
import analyticsRoutes from "./routes/analytics.routes";
import authRoutes from "./routes/auth.routes";
import exportRoutes from "./routes/export.routes";
import listsRoutes from "./routes/lists.routes";
import meRoutes from "./routes/me.routes";
import remindersRoutes from "./routes/reminders.routes";
import searchRoutes from "./routes/search.routes";
import settingsRoutes from "./routes/settings.routes";
import soundsRoutes from "./routes/sounds.routes";
import syncRoutes from "./routes/sync.routes";
import vacationModeRoutes from "./routes/vacation-mode.routes";
import versionRoutes from "./routes/version.routes";

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
app.use("/", versionRoutes);
app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/sync", syncRoutes);
app.use("/", remindersRoutes);
app.use("/vacation-mode", vacationModeRoutes);
app.use("/", exportRoutes);
app.use("/", searchRoutes);
app.use("/lists", listsRoutes);
app.use("/home", homeRoutes);
app.use("/history", historyAggregateRoutes);
app.use("/history", historyDailyRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/sounds", soundsRoutes);
app.use("/habits", habitsRoutes);
app.use("/settings", settingsRoutes);

app.use(errorHandler);

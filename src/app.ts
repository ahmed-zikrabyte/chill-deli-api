import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import apiRoutes from "./api";
import { connectToMongoDB } from "./config/database";
import { ENV } from "./config/env";
import { HTTP } from "./config/http-status.config";
import { allowedOrigins } from "./config/origins.config";
import { errorHandler } from "./middleware/error.middleware";
import logger from "./utils/logger.util";

const app: Express = express();

app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api", apiRoutes);

app.get("/health", (_req, res) => {
  res
    .status(HTTP.OK)
    .json({ status: "UP", message: "Server is up and kicking." });
});

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectToMongoDB();

    app.listen(ENV.app.port, () => {
      logger.info(
        `🚀 Server running in ${ENV.app.nodeEnv} mode on port ${ENV.app.port}`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();

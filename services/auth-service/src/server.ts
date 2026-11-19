
import express from "express";
import dotenv from "dotenv";

import { connectDatabase } from "./config/database";
import { redis } from "./config/redis";
import { connectRedis } from "./config/redis";

import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

 app.use("/api", healthRoutes);
 app.use("/api/auth", authRoutes);

const PORT = Number(process.env.PORT || 3001);

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start auth service:", error);
    process.exit(1);
  }
};

startServer();

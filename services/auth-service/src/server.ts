
import express from "express";
import dotenv from "dotenv";

import { connectDatabase } from "./config/database";
// import healthRoutes from "./routes/health.routes";

dotenv.config();

const app = express();

app.use(express.json());

// app.use("/api", healthRoutes);

const PORT = Number(process.env.PORT || 3001);

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start auth service:", error);
    process.exit(1);
  }
};

startServer();

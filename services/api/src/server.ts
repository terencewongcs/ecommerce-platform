import mongoose from "mongoose";
import { env } from "./lib/env.js";
import app from "./app.js";

async function start() {
  // Connect to MongoDB before accepting any traffic
  await mongoose.connect(env.MONGODB_URI);
  console.log("MongoDB connected");

  app.listen(env.PORT, () => {
    console.log(`API server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

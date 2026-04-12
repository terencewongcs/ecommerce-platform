import "dotenv/config";
import { type Request, type Response, type NextFunction } from "express";
import { connectDB } from "./lib/mongoose.js";
import app from "./app.js";

// Ensure DB is connected before every request.
// connectDB() is idempotent — it reuses the cached connection on warm invocations.
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

export default app;

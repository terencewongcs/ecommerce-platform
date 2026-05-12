import "dotenv/config";
import { connectDB } from "./lib/mongoose.js";
import app from "./app.js";

// Connect to MongoDB on cold start (cached on warm invocations)
connectDB().catch(console.error);

export default app;

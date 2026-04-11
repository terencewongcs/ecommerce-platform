import "dotenv/config";
import { connectDB } from "../src/lib/mongoose.js";
import app from "../src/app.js";

// Connect to MongoDB on cold start (cached on warm invocations)
connectDB().catch(console.error);

export default app;

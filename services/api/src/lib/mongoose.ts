import mongoose from "mongoose";
import { env } from "./env.js";

// In serverless environments, modules are cached between warm invocations.
// This global persists the connection across requests within the same function instance.
declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: typeof mongoose | undefined;
}

export async function connectDB(): Promise<void> {
  if (global.__mongooseConn && mongoose.connection.readyState === 1) {
    return; // reuse existing connection
  }
  await mongoose.connect(env.MONGODB_URI);
  global.__mongooseConn = mongoose;
}

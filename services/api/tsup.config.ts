import { defineConfig } from "tsup";

export default defineConfig({
  // Output to api/index.js — Vercel auto-detects files in api/ as serverless functions
  entry: { index: "src/vercel.ts" },
  format: ["esm"],
  outDir: "api",
  platform: "node",
  // inline the workspace package so Vercel doesn't need to resolve it at runtime
  noExternal: ["@trendyuniquellc/types"],
});

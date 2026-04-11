import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["api/index.ts"],
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  // inline the workspace package so Vercel doesn't need to resolve it at runtime
  noExternal: ["@trendyuniquellc/types"],
});

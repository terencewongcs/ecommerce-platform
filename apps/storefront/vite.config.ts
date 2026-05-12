import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
    // Uploads source maps to Sentry during production builds so that error
    // stack traces show original source code instead of minified code.
    // Requires SENTRY_AUTH_TOKEN to be set in the build environment.
    // Has no effect when SENTRY_AUTH_TOKEN is absent (e.g. local dev).
    sentryVitePlugin({
      org: "yanxuan-wang",
      project: "tu-storefront",
    }),
  ],
  build: {
    // Source maps are required for Sentry to map minified code back to source
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
});

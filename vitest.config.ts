import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    // Default to happy-dom so tests exercising localStorage or the
    // window object work without per-file env annotations. Node-only
    // suites still run fine here since we do not need Node-specific
    // globals absent from happy-dom.
    environment: "happy-dom",
    include: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
    exclude: [
      "node_modules",
      ".next",
      "**/*_backup/**",
      "**/*_archived/**",
      // Exclude renamed backup directories that are prefixed with _
      // but NOT __tests__ directories which are valid test containers.
      "app/api/_*",
      "app/api/_*/**",
      "app/_upload_backup",
      "app/_upload_backup/**",
    ],
  },
});

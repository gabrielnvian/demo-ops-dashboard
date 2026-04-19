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
    exclude: ["node_modules", ".next"],
  },
});

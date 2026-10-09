import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Dedicated Vitest config for API integration tests.
 * - Runs against a provisioned TEST Postgres database (see tests/api/).
 * - Single fork: suites share one database, so no parallel workers.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/api/**/*.test.ts"],
    setupFiles: ["tests/api/setup.ts"],
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});

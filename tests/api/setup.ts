/**
 * Vitest setup file for API integration tests.
 *
 * Runs in each worker BEFORE any test module is imported, so the Prisma
 * singleton (created at import time) picks up the test database URL.
 */
import { TEST_DB_URL, TEST_JWT_SECRET } from "./testEnv";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = TEST_DB_URL;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
}

/**
 * Shared constants for the API integration tests.
 *
 * The test database is separate from the development database so the
 * suite never touches real/dev data. Override with TEST_DATABASE_URL.
 */

export const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/anilliea_test";

export const TEST_ADMIN_EMAIL = "admin@anilliea.test";
export const TEST_ADMIN_PASSWORD = "TestAdmin123!";
export const TEST_DEMO_PASSWORD = "TestDemo123!";
export const TEST_JWT_SECRET = "anilliea-test-jwt-secret-do-not-use-in-prod";

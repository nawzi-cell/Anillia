/**
 * Provisions the API-test database: pushes the Prisma schema and runs the
 * regular seed against the TEST database (never the dev database).
 *
 * Run via:  npm run test:api
 * (which executes this file, then vitest)
 */
import { execSync } from "node:child_process";
import {
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_PASSWORD,
  TEST_DB_URL,
  TEST_DEMO_PASSWORD,
  TEST_JWT_SECRET,
} from "./testEnv";

const env = {
  ...process.env,
  DATABASE_URL: TEST_DB_URL,
  ADMIN_EMAIL: TEST_ADMIN_EMAIL,
  ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
  DEMO_PASSWORD: TEST_DEMO_PASSWORD,
  JWT_SECRET: TEST_JWT_SECRET,
};

console.log(`[test:api] provisioning test database ${TEST_DB_URL}`);
execSync("npx prisma db push --skip-generate", { stdio: "inherit", env });
execSync("npx prisma db seed", { stdio: "inherit", env });
console.log("[test:api] database ready");

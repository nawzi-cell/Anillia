import { PrismaClient } from "@prisma/client";

// Global-singleton PrismaClient: avoids exhausting database connections
// during development hot-reloads and in serverless environments.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Alias for `prisma`, for convenience. */
export const db: PrismaClient = prisma;

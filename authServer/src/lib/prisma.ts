import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [ "query", "error", "warn"], // optional
  });

// Prevent multiple instances during hot-reloads in dev (like with Nodemon or Next.js)
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

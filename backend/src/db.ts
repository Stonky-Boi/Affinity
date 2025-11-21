import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Create the connection pool
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });

// 2. Create the adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to PrismaClient
const prisma = new PrismaClient({ adapter }).$extends({
    query: {
        user: {
            async findFirst({ args, query }) {
                args.where = { ...(args.where || {}), deleted_at: null };
                return query(args);
            },
            async findUnique({ args, query }) {
                args.where = { ...(args.where || {}), deleted_at: null };
                return query(args);
            },
            async findMany({ args, query }) {
                args.where = { ...(args.where || {}), deleted_at: null };
                return query(args);
            },
        },
    },
});

export default prisma;
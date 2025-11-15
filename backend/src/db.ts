import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient().$extends({
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
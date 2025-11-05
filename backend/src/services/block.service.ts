import prisma from '../db';

export const getBlockedUserIds = async (userId: number): Promise<number[]> => {
    const blocks = await prisma.block.findMany({
        where: { OR: [{ blocker_id: userId }, { blocked_id: userId }] },
        select: { blocker_id: true, blocked_id: true }
    });
    const blockedUserIds = blocks.map(b =>
        b.blocker_id === userId ? b.blocked_id : b.blocker_id
    );
    // Add the user's own ID to the list to filter themselves out
    blockedUserIds.push(userId);
    return blockedUserIds;
};
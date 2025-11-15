import prisma from '../db';
import redisClient from '../redis';

const WEIGHTS = {
    message: 2,
    comment: 3,
    reaction: 1,
};

const MAX_SCORE = (50 * WEIGHTS.message) + (20 * WEIGHTS.comment) + (50 * WEIGHTS.reaction);
const CACHE_EXPIRATION_SECONDS = 3600;

const calculateScore = (counts: { messages: number, comments: number, reactions: number }): number => {
    const rawScore =
        (counts.messages * WEIGHTS.message) +
        (counts.comments * WEIGHTS.comment) +
        (counts.reactions * WEIGHTS.reaction);
    const normalizedScore = Math.min((rawScore / MAX_SCORE) * 100, 100);
    return Math.round(normalizedScore);
};

export const updateFriendshipCounters = async (
    userId1: number,
    userId2: number,
    metric: 'num_messages' | 'num_comments' | 'num_reactions',
    operation: 'increment' | 'decrement'
) => {
    if (userId1 === userId2) return;
    const userA = Math.min(userId1, userId2);
    const userB = Math.max(userId1, userId2);
    const cacheKey = `friendScore:${userA}:${userB}`;
    try {
        const operationData = { [metric]: { [operation]: 1 } };
        let updatedFriendship;
        if (operation === 'increment') {
            updatedFriendship = await prisma.friendship.upsert({
                where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } },
                create: { user_a_id: userA, user_b_id: userB, [metric]: 1 },
                update: operationData,
            });
        } else {
            await prisma.friendship.updateMany({
                where: {
                    user_a_id: userA,
                    user_b_id: userB,
                    [metric]: { gt: 0 }
                },
                data: operationData,
            });
            updatedFriendship = await prisma.friendship.findUnique({
                where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } },
            });
        }
        if (!updatedFriendship) return;
        const newScore = calculateScore({
            messages: updatedFriendship.num_messages,
            comments: updatedFriendship.num_comments,
            reactions: updatedFriendship.num_reactions,
        });
        await prisma.friendship.update({
            where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } },
            data: { friend_score: newScore },
        });
        await redisClient.set(cacheKey, newScore, { EX: CACHE_EXPIRATION_SECONDS });

    } catch (e) {
        console.error(`Failed to update friendship counters for ${userA}-${userB}:`, e);
    }
};

export const getFriendshipScore = async (userId1: number, userId2: number): Promise<number> => {
    if (userId1 === userId2) return 0;
    const userA = Math.min(userId1, userId2);
    const userB = Math.max(userId1, userId2);
    const cacheKey = `friendScore:${userA}:${userB}`;
    try {
        const cachedScore = await redisClient.get(cacheKey);
        if (cachedScore) {
            return parseInt(cachedScore, 10);
        }
    } catch (e) {
        console.error("Redis GET error in friendship.service:", e);
    }
    try {
        const friendship = await prisma.friendship.findUnique({
            where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } }
        });
        if (!friendship) {
            await redisClient.set(cacheKey, 0, { EX: CACHE_EXPIRATION_SECONDS });
            return 0;
        }
        const newScore = calculateScore({
            messages: friendship.num_messages,
            comments: friendship.num_comments,
            reactions: friendship.num_reactions
        });
        if (newScore !== friendship.friend_score) {
            prisma.friendship.update({
                where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } },
                data: { friend_score: newScore }
            }).catch(err => console.error("Async friend_score update failed:", err));
        }
        await redisClient.set(cacheKey, newScore, { EX: CACHE_EXPIRATION_SECONDS });
        return newScore;
    } catch (e) {
        console.error("Failed to get friendship score:", e);
        return 0;
    }
};
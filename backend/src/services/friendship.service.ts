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
        const [
            messagesAB, messagesBA,
            commentsAB, commentsBA,
            reactionsAB, reactionsBA
        ] = await Promise.all([
            prisma.message.count({ where: { sender_id: userA, conversation: { participants: { some: { id: userB } } } } }),
            prisma.message.count({ where: { sender_id: userB, conversation: { participants: { some: { id: userA } } } } }),
            prisma.comment.count({ where: { author_id: userA, post: { author_id: userB }, deleted_at: null } }),
            prisma.comment.count({ where: { author_id: userB, post: { author_id: userA }, deleted_at: null } }),
            prisma.reaction.count({ where: { user_id: userA, post: { author_id: userB } } }),
            prisma.reaction.count({ where: { user_id: userB, post: { author_id: userA } } })
        ]);
        const totalCounts = {
            messages: messagesAB + messagesBA,
            comments: commentsAB + commentsBA,
            reactions: reactionsAB + reactionsBA
        };
        const newScore = calculateScore(totalCounts);
        try {
            await redisClient.set(cacheKey, newScore, { EX: CACHE_EXPIRATION_SECONDS });
        } catch (e) {
            console.error("Redis SET error in friendship.service:", e);
        }
        return newScore;
    } catch (e) {
        console.error("Failed to calculate friendship score:", e);
        return 0;
    }
};
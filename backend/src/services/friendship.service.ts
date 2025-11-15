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
  if (userId1 === userId2) return; // No friendship with oneself

  const userA = Math.min(userId1, userId2);
  const userB = Math.max(userId1, userId2);
  const cacheKey = `friendScore:${userA}:${userB}`;

  try {
    const operationData = { [metric]: { [operation]: 1 } };
    let updatedFriendship;

    // 1. Increment or Decrement the counter
    if (operation === 'increment') {
      updatedFriendship = await prisma.friendship.upsert({
        where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } },
        create: { user_a_id: userA, user_b_id: userB, [metric]: 1 },
        update: operationData,
      });
    } else {
      // Decrement, but prevent going below 0
      await prisma.friendship.updateMany({
        where: {
          user_a_id: userA,
          user_b_id: userB,
          [metric]: { gt: 0 } // Only update if count > 0
        },
        data: operationData,
      });
      // Get the resulting record
      updatedFriendship = await prisma.friendship.findUnique({
        where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } },
      });
    }

    if (!updatedFriendship) return; // Nothing to do

    // 2. Recalculate the score from the new counts
    const newScore = calculateScore({
      messages: updatedFriendship.num_messages,
      comments: updatedFriendship.num_comments,
      reactions: updatedFriendship.num_reactions,
    });

    // 3. Update the score in the database
    await prisma.friendship.update({
      where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } },
      data: { friend_score: newScore },
    });

    // 4. Update the cache
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

  // 1. Try cache first
  try {
    const cachedScore = await redisClient.get(cacheKey);
    if (cachedScore) {
      return parseInt(cachedScore, 10);
    }
  } catch (e) {
    console.error("Redis GET error in friendship.service:", e);
  }

  // 2. Cache miss, read from DB
  try {
    const friendship = await prisma.friendship.findUnique({
      where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } }
    });

    if (!friendship) {
      await redisClient.set(cacheKey, 0, { EX: CACHE_EXPIRATION_SECONDS });
      return 0; // No interactions yet
    }

    // 3. Recalculate score from raw counters (This is the bug fix)
    const newScore = calculateScore({
      messages: friendship.num_messages,
      comments: friendship.num_comments,
      reactions: friendship.num_reactions
    });

    // 4. If score in DB is stale, update it (but don't wait)
    if (newScore !== friendship.friend_score) {
      prisma.friendship.update({
        where: { user_a_id_user_b_id: { user_a_id: userA, user_b_id: userB } },
        data: { friend_score: newScore }
      }).catch(err => console.error("Async friend_score update failed:", err));
    }
    
    // 5. Update cache and return
    await redisClient.set(cacheKey, newScore, { EX: CACHE_EXPIRATION_SECONDS });
    return newScore;

  } catch (e) {
    console.error("Failed to get friendship score:", e);
    return 0;
  }
};
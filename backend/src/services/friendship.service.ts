import prisma from '../db';

// Define the weights for your algorithm
const FRIENDSHIP_WEIGHTS = {
  message: 2,
  comment: 3,
  reaction: 1,
};

type FriendshipUpdateData = {
  num_messages?: { increment: number };
  num_reactions?: { increment: number };
  num_comments?: { increment: number };
};

export const updateFriendship = async (userId1: number, userId2: number, data: FriendshipUpdateData) => {
  if (userId1 === userId2) return; // Don't track self-interaction
  const user_a_id = Math.min(userId1, userId2);
  const user_b_id = Math.max(userId1, userId2);
  try {
    const friendship = await prisma.friendship.upsert({
      where: {
        user_a_id_user_b_id: { user_a_id, user_b_id },
      },
      update: data, // Apply the increment (e.g., num_messages: { increment: 1 })
      create: {
        user_a_id,
        user_b_id,
        num_messages: data.num_messages?.increment || 0,
        num_reactions: data.num_reactions?.increment || 0,
        num_comments: data.num_comments?.increment || 0,
        friend_score: 0,
      },
    });
    // Recalculate the friend_score based on the new totals
    const newScore =
      (friendship.num_messages + (data.num_messages?.increment || 0)) * FRIENDSHIP_WEIGHTS.message +
      (friendship.num_comments + (data.num_comments?.increment || 0)) * FRIENDSHIP_WEIGHTS.comment +
      (friendship.num_reactions + (data.num_reactions?.increment || 0)) * FRIENDSHIP_WEIGHTS.reaction;
    // Update the score using the correct composite key
    await prisma.friendship.update({
      where: {
        user_a_id_user_b_id: {
          user_a_id: user_a_id,
          user_b_id: user_b_id,
        },
      },
      data: {
        friend_score: newScore,
      },
    });
  } catch (error) {
    console.error("Failed to update friendship:", error);
  }
};
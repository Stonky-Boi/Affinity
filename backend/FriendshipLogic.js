const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateFriendship(userId1, userId2, updateData) {
  if (userId1 === userId2) return;

  const [userA_id, userB_id] = [userId1, userId2].sort();

  // 1. Identify which field we are updating (e.g., 'num_comments')
  const fieldToUpdate = Object.keys(updateData)[0];

  // 2. Create the data for a NEW friendship record with an initial value of 1
  const createData = {
    user_a_id: userA_id,
    user_b_id: userB_id,
    [fieldToUpdate]: 1, // Use a simple integer for creation
  };

  await prisma.friendship.upsert({
    where: {
      user_a_id_user_b_id: {
        user_a_id: userA_id,
        user_b_id: userB_id,
      },
    },
    update: updateData, // This is correct (uses { increment: 1 })
    create: createData,  // This is now correct (uses a simple number)
  });
}

module.exports = { updateFriendship };
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

type UpdateData = {
  [key: string]: { increment: number };
};

async function updateFriendship(userId1: number, userId2: number, updateData: UpdateData) {
  if (userId1 === userId2) return;

  const [userA_id, userB_id] = [userId1, userId2].sort();

  const fieldToUpdate = Object.keys(updateData)[0];

  if (!fieldToUpdate) {
    return;
  }

  const createData = {
    user_a_id: userA_id,
    user_b_id: userB_id,
    [fieldToUpdate]: 1,
  };

  await prisma.friendship.upsert({
    where: {
      user_a_id_user_b_id: {
        user_a_id: userA_id,
        user_b_id: userB_id,
      },
    },
    update: updateData,
    create: createData,
  });
}

module.exports = { updateFriendship };

export { };
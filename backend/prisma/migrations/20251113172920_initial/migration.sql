/*
  Warnings:

  - You are about to drop the column `friend_score` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `num_comments` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `num_messages` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `num_reactions` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `privacy_settings` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Friendship" DROP COLUMN "friend_score",
DROP COLUMN "num_comments",
DROP COLUMN "num_messages",
DROP COLUMN "num_reactions";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "privacy_settings",
DROP COLUMN "state";

-- CreateTable
CREATE TABLE "UserSettings" (
    "user_id" INTEGER NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

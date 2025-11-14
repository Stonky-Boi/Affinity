/*
  Warnings:

  - Made the column `reaction_type` on table `Reaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Reaction" ALTER COLUMN "reaction_type" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "email" DROP NOT NULL;

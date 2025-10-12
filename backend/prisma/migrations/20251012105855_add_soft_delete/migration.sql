-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "deleted_at" TIMESTAMP(3);

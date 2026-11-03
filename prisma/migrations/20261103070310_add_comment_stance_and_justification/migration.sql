/*
  Warnings:

  - Added the required column `justification` to the `comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stance` to the `comment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CommentStance" AS ENUM ('FOR', 'AGAINST');

-- AlterTable
ALTER TABLE "comment" ADD COLUMN     "justification" TEXT NOT NULL,
ADD COLUMN     "stance" "CommentStance" NOT NULL;

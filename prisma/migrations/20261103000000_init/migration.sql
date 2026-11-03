-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('CONFIRMED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PERSONAL');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('VALIDATE', 'PENDING', 'REFUSED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CONFIRMED', 'CONTRADICTED', 'PARTIALLY_TRUE', 'MISLEADING', 'MISSING_CONTEXT');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('SUPPORTS', 'CONTRADICTS');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('DIRECT_WITNESS', 'DOCUMENT', 'OFFICIAL_SOURCE', 'LINK', 'PHOTO', 'VIDEO');

-- CreateTable
CREATE TABLE "media" (
    "media_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "city" TEXT,
    "website" TEXT,

    CONSTRAINT "media_pkey" PRIMARY KEY ("media_id")
);

-- CreateTable
CREATE TABLE "topic" (
    "topic_id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "topic_pkey" PRIMARY KEY ("topic_id")
);

-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PERSONAL',
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "proof_front_url" TEXT,
    "proof_back_url" TEXT,
    "email_verified_at" TIMESTAMP(3),
    "email_code_hash" TEXT,
    "email_code_expires_at" TIMESTAMP(3),
    "email_code_sent_at" TIMESTAMP(3),
    "email_code_attempts" INTEGER NOT NULL DEFAULT 0,
    "media_id" INTEGER,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "article" (
    "article_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "location" TEXT,
    "event_date" TIMESTAMP(3),
    "cover_image_url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PostStatus" NOT NULL DEFAULT 'NEW',
    "confidence_score" DOUBLE PRECISION,
    "relation_type" "RelationType",
    "author_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "parent_article_id" INTEGER,

    CONSTRAINT "article_pkey" PRIMARY KEY ("article_id")
);

-- CreateTable
CREATE TABLE "verification" (
    "verification_id" SERIAL NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "justification" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "article_id" INTEGER NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("verification_id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "evidence_id" SERIAL NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "url" TEXT,
    "file" TEXT,
    "description" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "article_id" INTEGER NOT NULL,
    "verification_id" INTEGER,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("evidence_id")
);

-- CreateTable
CREATE TABLE "comment" (
    "comment_id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "commented_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "article_id" INTEGER NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "external_publication" (
    "publication_id" SERIAL NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "author_name" TEXT,
    "author_type" TEXT,
    "excerpt" TEXT,
    "external_posted_at" TIMESTAMP(3),
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "article_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "external_publication_pkey" PRIMARY KEY ("publication_id")
);

-- CreateTable
CREATE TABLE "image" (
    "image_id" SERIAL NOT NULL,
    "file_url" TEXT NOT NULL,
    "perceptual_hash" TEXT,
    "first_seen_at" TIMESTAMP(3),
    "article_id" INTEGER,
    "publication_id" INTEGER,

    CONSTRAINT "image_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "ai_analysis" (
    "analysis_id" SERIAL NOT NULL,
    "ai_score" DOUBLE PRECISION NOT NULL,
    "model_used" TEXT NOT NULL,
    "detail" JSONB,
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publication_id" INTEGER,
    "image_id" INTEGER,

    CONSTRAINT "ai_analysis_pkey" PRIMARY KEY ("analysis_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topic_label_key" ON "topic"("label");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_media_id_idx" ON "user"("media_id");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");

-- CreateIndex
CREATE INDEX "article_author_id_idx" ON "article"("author_id");

-- CreateIndex
CREATE INDEX "article_topic_id_idx" ON "article"("topic_id");

-- CreateIndex
CREATE INDEX "article_parent_article_id_idx" ON "article"("parent_article_id");

-- CreateIndex
CREATE INDEX "verification_article_id_idx" ON "verification"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_user_id_article_id_key" ON "verification"("user_id", "article_id");

-- CreateIndex
CREATE INDEX "evidence_user_id_idx" ON "evidence"("user_id");

-- CreateIndex
CREATE INDEX "evidence_article_id_idx" ON "evidence"("article_id");

-- CreateIndex
CREATE INDEX "evidence_verification_id_idx" ON "evidence"("verification_id");

-- CreateIndex
CREATE INDEX "comment_user_id_idx" ON "comment"("user_id");

-- CreateIndex
CREATE INDEX "comment_article_id_idx" ON "comment"("article_id");

-- CreateIndex
CREATE INDEX "external_publication_article_id_idx" ON "external_publication"("article_id");

-- CreateIndex
CREATE INDEX "external_publication_user_id_idx" ON "external_publication"("user_id");

-- CreateIndex
CREATE INDEX "image_article_id_idx" ON "image"("article_id");

-- CreateIndex
CREATE INDEX "image_publication_id_idx" ON "image"("publication_id");

-- CreateIndex
CREATE INDEX "image_perceptual_hash_idx" ON "image"("perceptual_hash");

-- CreateIndex
CREATE INDEX "ai_analysis_publication_id_idx" ON "ai_analysis"("publication_id");

-- CreateIndex
CREATE INDEX "ai_analysis_image_id_idx" ON "ai_analysis"("image_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("media_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topic"("topic_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_parent_article_id_fkey" FOREIGN KEY ("parent_article_id") REFERENCES "article"("article_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification" ADD CONSTRAINT "verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification" ADD CONSTRAINT "verification_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("article_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("article_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "verification"("verification_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("article_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_publication" ADD CONSTRAINT "external_publication_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("article_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_publication" ADD CONSTRAINT "external_publication_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("article_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "external_publication"("publication_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "external_publication"("publication_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image"("image_id") ON DELETE CASCADE ON UPDATE CASCADE;

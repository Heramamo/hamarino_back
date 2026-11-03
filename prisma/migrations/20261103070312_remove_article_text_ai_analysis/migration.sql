DELETE FROM "ai_analysis" WHERE "article_id" IS NOT NULL;

ALTER TABLE "ai_analysis"
DROP CONSTRAINT IF EXISTS "ai_analysis_article_id_fkey";

DROP INDEX IF EXISTS "ai_analysis_article_id_idx";

ALTER TABLE "ai_analysis"
DROP COLUMN IF EXISTS "article_id",
DROP COLUMN IF EXISTS "is_ai_generated";

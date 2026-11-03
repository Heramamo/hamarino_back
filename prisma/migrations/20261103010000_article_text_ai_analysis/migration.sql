ALTER TABLE "ai_analysis" ADD COLUMN "article_id" INTEGER;
ALTER TABLE "ai_analysis" ADD COLUMN "is_ai_generated" BOOLEAN;

CREATE INDEX "ai_analysis_article_id_idx" ON "ai_analysis"("article_id");

ALTER TABLE "ai_analysis"
ADD CONSTRAINT "ai_analysis_article_id_fkey"
FOREIGN KEY ("article_id") REFERENCES "article"("article_id")
ON DELETE CASCADE ON UPDATE CASCADE;

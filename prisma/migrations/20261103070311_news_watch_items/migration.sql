CREATE TABLE "news_watch_item" (
    "watch_item_id" SERIAL NOT NULL,
    "provider_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT NOT NULL,
    "source_id" TEXT,
    "source_name" TEXT,
    "source_url" TEXT,
    "language" TEXT,
    "country" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_url" TEXT,
    "sentiment" TEXT,
    "published_at" TIMESTAMP(3),
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_watch_item_pkey" PRIMARY KEY ("watch_item_id")
);

CREATE UNIQUE INDEX "news_watch_item_provider_id_key" ON "news_watch_item"("provider_id");
CREATE INDEX "news_watch_item_published_at_idx" ON "news_watch_item"("published_at");
CREATE INDEX "news_watch_item_source_id_idx" ON "news_watch_item"("source_id");

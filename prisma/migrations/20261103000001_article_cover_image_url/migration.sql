-- Rattrapage des bases issues de `prisma db push` :
-- colonne ajoutée au schéma après le dernier push. Idempotent.
ALTER TABLE "article" ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT;

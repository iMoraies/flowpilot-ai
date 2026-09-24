DROP INDEX IF EXISTS "Organization_slug_key";

ALTER TABLE "Organization" DROP COLUMN IF EXISTS "slug";

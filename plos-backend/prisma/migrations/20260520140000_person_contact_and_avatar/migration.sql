-- Person contact fields (notifications) + optional avatar; user phone for account owner
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

UPDATE "Person" p
SET "email" = u."email"
FROM "User" u
WHERE p."userId" = u."id" AND p."relation" = 'self' AND p."email" IS NULL;

UPDATE "Person" p
SET "email" = 'person-' || p."id" || '@placeholder.plos.local'
WHERE p."email" IS NULL;

ALTER TABLE "Person" ALTER COLUMN "email" SET NOT NULL;

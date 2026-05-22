-- Roadmap H: account type (solo / family / shared)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountType" TEXT NOT NULL DEFAULT 'solo';

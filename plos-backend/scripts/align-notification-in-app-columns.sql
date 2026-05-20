-- Run against databases that have "Notification" but pre-date
-- migration 20260511120000_notification_in_app_fields (missing in-app columns).
-- Safe to re-run: uses IF NOT EXISTS where supported.

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification" ("userId", "readAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification" ("userId", "createdAt");

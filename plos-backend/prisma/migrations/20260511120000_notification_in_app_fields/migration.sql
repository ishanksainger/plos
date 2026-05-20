-- In-app notification content + read state
ALTER TABLE "Notification" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Notification" ADD COLUMN "message" TEXT;
ALTER TABLE "Notification" ADD COLUMN "readAt" TIMESTAMP(3);

CREATE INDEX "Notification_userId_readAt_idx" ON "Notification" ("userId", "readAt");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification" ("userId", "createdAt");

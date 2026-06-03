-- AlterTable: track completed tracker/CSV imports for the free-plan import cap (Step K)
ALTER TABLE "User" ADD COLUMN "importsUsed" INTEGER NOT NULL DEFAULT 0;

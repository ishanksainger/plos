-- AlterTable: track verification timestamp on User
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- CreateTable: short-lived password reset tokens
CREATE TABLE "PasswordResetToken" (
    "id"        SERIAL          NOT NULL,
    "userId"    INTEGER         NOT NULL,
    "token"     TEXT            NOT NULL,
    "expiresAt" TIMESTAMP(3)    NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_token_key"  ON "PasswordResetToken"("token");
CREATE INDEX        "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: signup verification tokens
CREATE TABLE "EmailVerificationToken" (
    "id"        SERIAL          NOT NULL,
    "userId"    INTEGER         NOT NULL,
    "token"     TEXT            NOT NULL,
    "expiresAt" TIMESTAMP(3)    NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_token_key"  ON "EmailVerificationToken"("token");
CREATE INDEX        "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

ALTER TABLE "EmailVerificationToken"
  ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

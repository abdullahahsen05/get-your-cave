-- Add user notification and authentication preference flags.
ALTER TABLE "User"
ADD COLUMN "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT true;

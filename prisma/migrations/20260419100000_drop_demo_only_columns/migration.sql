-- DropIndex
DROP INDEX IF EXISTS "JobOrder_sessionId_idx";

-- AlterTable: drop demo-only columns now that uploaded rows live in
-- the visitor's browser (localStorage) rather than shared Postgres.
ALTER TABLE "JobOrder" DROP COLUMN IF EXISTS "expiresAt";
ALTER TABLE "JobOrder" DROP COLUMN IF EXISTS "sessionId";

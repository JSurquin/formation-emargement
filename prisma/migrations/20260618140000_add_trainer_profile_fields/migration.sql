-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "dateOfBirth" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "companySiret" TEXT,
ADD COLUMN     "documents" JSONB;

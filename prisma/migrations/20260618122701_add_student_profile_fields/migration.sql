-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "documents" JSONB,
ADD COLUMN     "fundingMethod" TEXT,
ADD COLUMN     "socialSecurityNumber" TEXT;

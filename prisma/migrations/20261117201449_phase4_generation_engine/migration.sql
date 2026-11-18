-- AlterEnum
ALTER TYPE "GenerationStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Generation" ADD COLUMN     "aspectRatio" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "imageCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "outputUrls" JSONB,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'mock',
ADD COLUMN     "quality" TEXT,
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "GuideProfile" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "guideTypes" TEXT[],
ADD COLUMN     "maritalStatus" TEXT;

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "priceVnd" SET DEFAULT 1000;

-- Update existing seeded courses for the demo price.
UPDATE "Course" SET "priceVnd" = 1000;

ALTER TABLE "Course" ALTER COLUMN "priceVnd" SET DEFAULT 2000;

UPDATE "Course" SET "priceVnd" = 2000;

UPDATE "CoursePurchase"
SET "amountVnd" = 2000
WHERE "status" = 'PENDING';

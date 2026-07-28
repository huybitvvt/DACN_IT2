-- Programming languages are runtime configuration, not a closed business enum.
-- Text columns let new Judge0 runtimes be added without another database enum migration.
ALTER TABLE "Course"
ALTER COLUMN "language" TYPE VARCHAR(80)
USING "language"::text;

ALTER TABLE "Example"
ALTER COLUMN "language" TYPE VARCHAR(80)
USING "language"::text;

ALTER TABLE "Exercise"
ALTER COLUMN "language" TYPE VARCHAR(80)
USING "language"::text;

DROP TYPE "ProgrammingLanguage";

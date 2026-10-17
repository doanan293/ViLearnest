-- Contract step for 0006: run only after the bilingual deploy is live.
-- Rows the previous deploy wrote between 0006 and the deploy only have the old columns; copy them first.
DO $$
BEGIN
  -- Skipped on databases where the old columns are already gone.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Course' AND column_name = 'title') THEN
    UPDATE "Course" SET "titleEn" = "title" WHERE coalesce("titleEn", "titleVi") IS NULL AND "title" IS NOT NULL;
    UPDATE "Course" SET "smallDescriptionEn" = "smallDescription"
      WHERE coalesce("smallDescriptionEn", "smallDescriptionVi") IS NULL AND "smallDescription" IS NOT NULL;
    UPDATE "Course" SET "descriptionEn" = "description"
      WHERE coalesce("descriptionEn", "descriptionVi") IS NULL AND "description" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Chapter' AND column_name = 'title') THEN
    UPDATE "Chapter" SET "titleEn" = "title" WHERE coalesce("titleEn", "titleVi") IS NULL AND "title" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Lesson' AND column_name = 'title') THEN
    UPDATE "Lesson" SET "titleEn" = "title" WHERE coalesce("titleEn", "titleVi") IS NULL AND "title" IS NOT NULL;
    UPDATE "Lesson" SET "descriptionEn" = "description"
      WHERE coalesce("descriptionEn", "descriptionVi") IS NULL AND "description" IS NOT NULL;
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "Course" DROP COLUMN IF EXISTS "title";--> statement-breakpoint
ALTER TABLE "Course" DROP COLUMN IF EXISTS "smallDescription";--> statement-breakpoint
ALTER TABLE "Course" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "Chapter" DROP COLUMN IF EXISTS "title";--> statement-breakpoint
ALTER TABLE "Lesson" DROP COLUMN IF EXISTS "title";--> statement-breakpoint
ALTER TABLE "Lesson" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
-- A title must have a non-space character in at least one language.
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_title_required";--> statement-breakpoint
ALTER TABLE "Course" ADD CONSTRAINT "Course_title_required"
  CHECK (coalesce(nullif(trim("titleEn"), ''), nullif(trim("titleVi"), '')) IS NOT NULL);--> statement-breakpoint
ALTER TABLE "Chapter" DROP CONSTRAINT IF EXISTS "Chapter_title_required";--> statement-breakpoint
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_title_required"
  CHECK (coalesce(nullif(trim("titleEn"), ''), nullif(trim("titleVi"), '')) IS NOT NULL);--> statement-breakpoint
ALTER TABLE "Lesson" DROP CONSTRAINT IF EXISTS "Lesson_title_required";--> statement-breakpoint
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_title_required"
  CHECK (coalesce(nullif(trim("titleEn"), ''), nullif(trim("titleVi"), '')) IS NOT NULL);

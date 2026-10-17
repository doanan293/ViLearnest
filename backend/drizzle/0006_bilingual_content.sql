-- Split course, chapter and lesson text into English and Vietnamese columns (expand step).
-- Each existing value is copied to the Vi column when it contains Vietnamese letters, otherwise to En.
-- The old columns stay, nullable, so the previous deploy keeps working until the new one is live;
-- 0007 drops them and adds the title CHECK constraints.
CREATE FUNCTION "vilearnest_is_vietnamese"(value text) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT value ~ '[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹĂÂĐÊÔƠƯÀÁẠẢÃẰẮẶẲẴẦẤẬẨẪÈÉẸẺẼỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕỒỐỘỔỖỜỚỢỞỠÙÚỤỦŨỪỨỰỬỮỲÝỴỶỸ]'
$$;--> statement-breakpoint
ALTER TABLE "Course" ADD COLUMN "titleEn" text;--> statement-breakpoint
ALTER TABLE "Course" ADD COLUMN "titleVi" text;--> statement-breakpoint
ALTER TABLE "Course" ADD COLUMN "smallDescriptionEn" text;--> statement-breakpoint
ALTER TABLE "Course" ADD COLUMN "smallDescriptionVi" text;--> statement-breakpoint
ALTER TABLE "Course" ADD COLUMN "descriptionEn" text;--> statement-breakpoint
ALTER TABLE "Course" ADD COLUMN "descriptionVi" text;--> statement-breakpoint
ALTER TABLE "Chapter" ADD COLUMN "titleEn" text;--> statement-breakpoint
ALTER TABLE "Chapter" ADD COLUMN "titleVi" text;--> statement-breakpoint
ALTER TABLE "Lesson" ADD COLUMN "titleEn" text;--> statement-breakpoint
ALTER TABLE "Lesson" ADD COLUMN "titleVi" text;--> statement-breakpoint
ALTER TABLE "Lesson" ADD COLUMN "descriptionEn" text;--> statement-breakpoint
ALTER TABLE "Lesson" ADD COLUMN "descriptionVi" text;--> statement-breakpoint
ALTER TABLE "Course" DISABLE TRIGGER "Course_set_updated_at";--> statement-breakpoint
ALTER TABLE "Chapter" DISABLE TRIGGER "Chapter_set_updated_at";--> statement-breakpoint
ALTER TABLE "Lesson" DISABLE TRIGGER "Lesson_set_updated_at";--> statement-breakpoint
UPDATE "Course" SET
  "titleVi" = CASE WHEN "vilearnest_is_vietnamese"("title") THEN "title" END,
  "titleEn" = CASE WHEN "vilearnest_is_vietnamese"("title") THEN NULL ELSE "title" END,
  "smallDescriptionVi" = CASE WHEN "vilearnest_is_vietnamese"("smallDescription") THEN "smallDescription" END,
  "smallDescriptionEn" = CASE WHEN "vilearnest_is_vietnamese"("smallDescription") THEN NULL ELSE "smallDescription" END,
  "descriptionVi" = CASE WHEN "vilearnest_is_vietnamese"("description") THEN "description" END,
  "descriptionEn" = CASE WHEN "vilearnest_is_vietnamese"("description") THEN NULL ELSE "description" END;--> statement-breakpoint
UPDATE "Chapter" SET
  "titleVi" = CASE WHEN "vilearnest_is_vietnamese"("title") THEN "title" END,
  "titleEn" = CASE WHEN "vilearnest_is_vietnamese"("title") THEN NULL ELSE "title" END;--> statement-breakpoint
UPDATE "Lesson" SET
  "titleVi" = CASE WHEN "vilearnest_is_vietnamese"("title") THEN "title" END,
  "titleEn" = CASE WHEN "vilearnest_is_vietnamese"("title") THEN NULL ELSE "title" END,
  "descriptionVi" = CASE WHEN "vilearnest_is_vietnamese"("description") THEN "description" END,
  "descriptionEn" = CASE WHEN "vilearnest_is_vietnamese"("description") THEN NULL ELSE "description" END;--> statement-breakpoint
ALTER TABLE "Course" ENABLE TRIGGER "Course_set_updated_at";--> statement-breakpoint
ALTER TABLE "Chapter" ENABLE TRIGGER "Chapter_set_updated_at";--> statement-breakpoint
ALTER TABLE "Lesson" ENABLE TRIGGER "Lesson_set_updated_at";--> statement-breakpoint
ALTER TABLE "Course" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Course" ALTER COLUMN "smallDescription" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Course" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Chapter" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Lesson" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
DROP FUNCTION "vilearnest_is_vietnamese"(text);

-- Split course, chapter and lesson text into English and Vietnamese columns.
-- Each existing value moves to the Vi column when it contains Vietnamese letters, otherwise to En.
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
ALTER TABLE "Course" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "Course" DROP COLUMN "smallDescription";--> statement-breakpoint
ALTER TABLE "Course" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "Chapter" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "Lesson" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "Lesson" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "Course" ADD CONSTRAINT "Course_title_required" CHECK (coalesce("titleEn", "titleVi") is not null);--> statement-breakpoint
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_title_required" CHECK (coalesce("titleEn", "titleVi") is not null);--> statement-breakpoint
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_title_required" CHECK (coalesce("titleEn", "titleVi") is not null);--> statement-breakpoint
DROP FUNCTION "vilearnest_is_vietnamese"(text);

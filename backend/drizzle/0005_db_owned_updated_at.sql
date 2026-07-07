CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "Chapter" ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "Course" ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "Enrollment" ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "Lesson" ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "LessonProgess" ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "user_profile" ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updatedAt" SET DEFAULT now();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "account_set_updated_at" ON "account";
--> statement-breakpoint
CREATE TRIGGER "account_set_updated_at"
BEFORE UPDATE ON "account"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "Chapter_set_updated_at" ON "Chapter";
--> statement-breakpoint
CREATE TRIGGER "Chapter_set_updated_at"
BEFORE UPDATE ON "Chapter"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "Course_set_updated_at" ON "Course";
--> statement-breakpoint
CREATE TRIGGER "Course_set_updated_at"
BEFORE UPDATE ON "Course"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "Enrollment_set_updated_at" ON "Enrollment";
--> statement-breakpoint
CREATE TRIGGER "Enrollment_set_updated_at"
BEFORE UPDATE ON "Enrollment"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "Lesson_set_updated_at" ON "Lesson";
--> statement-breakpoint
CREATE TRIGGER "Lesson_set_updated_at"
BEFORE UPDATE ON "Lesson"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "LessonProgess_set_updated_at" ON "LessonProgess";
--> statement-breakpoint
CREATE TRIGGER "LessonProgess_set_updated_at"
BEFORE UPDATE ON "LessonProgess"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "session_set_updated_at" ON "session";
--> statement-breakpoint
CREATE TRIGGER "session_set_updated_at"
BEFORE UPDATE ON "session"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "user_set_updated_at" ON "user";
--> statement-breakpoint
CREATE TRIGGER "user_set_updated_at"
BEFORE UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "user_profile_set_updated_at" ON "user_profile";
--> statement-breakpoint
CREATE TRIGGER "user_profile_set_updated_at"
BEFORE UPDATE ON "user_profile"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
DROP TRIGGER IF EXISTS "verification_set_updated_at" ON "verification";
--> statement-breakpoint
CREATE TRIGGER "verification_set_updated_at"
BEFORE UPDATE ON "verification"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

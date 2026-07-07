CREATE TABLE "user_profile" (
	"userId" text PRIMARY KEY NOT NULL,
	"dateOfBirth" timestamp,
	"gender" text,
	"phoneNumber" text,
	"phoneVerified" boolean DEFAULT false NOT NULL,
	"country" text,
	"province" text,
	"district" text,
	"ward" text,
	"addressLine" text,
	"bio" text,
	"facebookUrl" text,
	"linkedinUrl" text,
	"githubUrl" text,
	"websiteUrl" text,
	"occupation" text,
	"organization" text,
	"education" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
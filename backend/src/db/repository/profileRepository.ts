import { desc, eq } from "drizzle-orm";
import type { NormalizedProfileInput } from "../../services/profileService.js";
import type { db as appDb } from "../index.js";
import * as schema from "../schema.js";

type DbClient = typeof appDb;

export class ProfileRepository {
  constructor(private readonly db: DbClient) {}

  async findProfileByUserId(userId: string) {
    const profile = await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      with: { profile: true },
    });
    return profile ?? null;
  }

  listUsers() {
    return this.db.query.user.findMany({
      orderBy: [desc(schema.user.createdAt)],
      with: { profile: true },
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, input: NormalizedProfileInput) {
    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.user)
        .set({
          name: input.name,
          image: input.image,
        })
        .where(eq(schema.user.id, userId));

      await tx
        .insert(schema.userProfile)
        .values({
          userId,
          dateOfBirth: input.dateOfBirth ?? null,
          gender: input.gender ?? null,
          phoneNumber: input.phoneNumber ?? null,
          phoneVerified: input.phoneVerified,
          country: input.country ?? null,
          province: input.province ?? null,
          district: input.district ?? null,
          ward: input.ward ?? null,
          addressLine: input.addressLine ?? null,
          bio: input.bio ?? null,
          facebookUrl: input.facebookUrl ?? null,
          linkedinUrl: input.linkedinUrl ?? null,
          githubUrl: input.githubUrl ?? null,
          websiteUrl: input.websiteUrl ?? null,
          occupation: input.occupation ?? null,
          organization: input.organization ?? null,
          education: input.education ?? null,
        })
        .onConflictDoUpdate({
          target: schema.userProfile.userId,
          set: {
            dateOfBirth: input.dateOfBirth ?? null,
            gender: input.gender ?? null,
            phoneNumber: input.phoneNumber ?? null,
            phoneVerified: input.phoneVerified,
            country: input.country ?? null,
            province: input.province ?? null,
            district: input.district ?? null,
            ward: input.ward ?? null,
            addressLine: input.addressLine ?? null,
            bio: input.bio ?? null,
            facebookUrl: input.facebookUrl ?? null,
            linkedinUrl: input.linkedinUrl ?? null,
            githubUrl: input.githubUrl ?? null,
            websiteUrl: input.websiteUrl ?? null,
            occupation: input.occupation ?? null,
            organization: input.organization ?? null,
            education: input.education ?? null,
          },
        });
    });

    const updated = await this.findProfileByUserId(userId);
    if (!updated) {
      throw new Error("Profile update failed");
    }
    return updated;
  }
}

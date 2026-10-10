import { describe, expect, it, jest } from "@jest/globals";
import { BadRequestError } from "../../src/lib/errors.js";
import { type ProfileRepositoryPort, ProfileService } from "../../src/services/profileService.js";

const baseUser = {
  id: "user-1",
  name: "An Nguyen",
  email: "an@example.com",
  image: null,
  role: "user",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

function createRepository(overrides: Partial<ProfileRepositoryPort> = {}): ProfileRepositoryPort {
  return {
    findProfileByUserId: jest.fn(async () => ({
      ...baseUser,
      profile: { phoneNumber: "+84901234567", phoneVerified: true },
    })),
    updateProfile: jest.fn<ProfileRepositoryPort["updateProfile"]>(async (_userId, input) => ({
      ...baseUser,
      name: input.name,
      image: input.image ?? null,
      profile: { ...input, phoneVerified: input.phoneVerified },
    })),
    listUsers: jest.fn(async () => []),
    ...overrides,
  };
}

describe("ProfileService", () => {
  it("normalizes social URLs and trims text fields", async () => {
    const repository = createRepository();
    const service = new ProfileService(repository);

    await service.updateProfile("user-1", {
      name: "  An Nguyen  ",
      image: "uploads/avatar.png",
      phoneNumber: " +84 901 234 567 ",
      facebookUrl: "facebook.com/an",
      websiteUrl: "https://andv.example.com",
      bio: "  Learning TypeScript  ",
    });

    expect(repository.updateProfile).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        name: "An Nguyen",
        phoneNumber: "+84 901 234 567",
        facebookUrl: "https://facebook.com/an",
        websiteUrl: "https://andv.example.com/",
        bio: "Learning TypeScript",
      })
    );
  });

  it("rejects a future date of birth", async () => {
    const service = new ProfileService(createRepository());

    await expect(
      service.updateProfile("user-1", {
        name: "An Nguyen",
        dateOfBirth: "2999-01-01",
      })
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects invalid phone numbers", async () => {
    const service = new ProfileService(createRepository());

    await expect(
      service.updateProfile("user-1", {
        name: "An Nguyen",
        phoneNumber: "abc",
      })
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("resets phoneVerified when the phone number changes", async () => {
    const repository = createRepository();
    const service = new ProfileService(repository);

    await service.updateProfile("user-1", {
      name: "An Nguyen",
      phoneNumber: "+84999888777",
    });

    expect(repository.updateProfile).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ phoneNumber: "+84999888777", phoneVerified: false })
    );
  });

  it("returns empty profile defaults from repository records without a profile row", async () => {
    const repository = createRepository({
      findProfileByUserId: jest.fn(async () => ({ ...baseUser, profile: null })),
    });
    const service = new ProfileService(repository);

    await expect(service.getProfile("user-1")).resolves.toEqual(
      expect.objectContaining({
        id: "user-1",
        email: "an@example.com",
        profile: null,
      })
    );
  });

  it("lists users through the repository for admin screens", async () => {
    const repository = createRepository({
      listUsers: jest.fn(async () => [{ ...baseUser, profile: { phoneNumber: "+84901234567", phoneVerified: false } }]),
    });
    const service = new ProfileService(repository);

    await expect(service.listUsers()).resolves.toHaveLength(1);
    expect(repository.listUsers).toHaveBeenCalledTimes(1);
  });
});

import { BadRequestError, NotFoundError } from "../lib/errors.js";

export type ProfileInput = {
  name: string;
  image?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  country?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  addressLine?: string | null;
  bio?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  occupation?: string | null;
  organization?: string | null;
  education?: string | null;
};

export type NormalizedProfileInput = Omit<ProfileInput, "dateOfBirth"> & {
  dateOfBirth?: Date | null;
  phoneVerified: boolean;
};

export type ProfileRecord = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  createdAt: Date;
  profile: Record<string, unknown> | null;
};

export interface ProfileRepositoryPort {
  findProfileByUserId(userId: string): Promise<ProfileRecord | null>;
  updateProfile(userId: string, input: NormalizedProfileInput): Promise<ProfileRecord>;
  listUsers(): Promise<ProfileRecord[]>;
}

const textLimits = {
  name: 100,
  gender: 40,
  phoneNumber: 30,
  country: 100,
  province: 100,
  district: 100,
  ward: 100,
  addressLine: 240,
  bio: 500,
  occupation: 120,
  organization: 160,
  education: 160,
};

function cleanText(value: string | null | undefined, max: number, field: string) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > max) {
    throw new BadRequestError(`${field} is too long`);
  }
  return trimmed;
}

function cleanRequiredName(value: string) {
  const trimmed = cleanText(value, textLimits.name, "name");
  if (!trimmed) {
    throw new BadRequestError("Name is required");
  }
  return trimmed;
}

function cleanUrl(value: string | null | undefined, field: string) {
  const trimmed = cleanText(value, 240, field);
  if (!trimmed) return null;
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new BadRequestError(`${field} must be a valid URL`);
    }
    return url.toString();
  } catch {
    throw new BadRequestError(`${field} must be a valid URL`);
  }
}

function cleanDateOfBirth(value: string | null | undefined) {
  const trimmed = cleanText(value, 20, "dateOfBirth");
  if (!trimmed) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError("dateOfBirth must be a valid date");
  }
  if (date.getTime() > Date.now()) {
    throw new BadRequestError("dateOfBirth cannot be in the future");
  }
  return date;
}

function cleanPhone(value: string | null | undefined) {
  const trimmed = cleanText(value, textLimits.phoneNumber, "phoneNumber");
  if (!trimmed) return null;
  if (!/^\+?[0-9][0-9\s().-]{7,28}$/.test(trimmed)) {
    throw new BadRequestError("phoneNumber must be a valid phone number");
  }
  return trimmed;
}

export class ProfileService {
  constructor(private readonly profiles: ProfileRepositoryPort) {}

  async getProfile(userId: string) {
    const profile = await this.profiles.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError("User not found");
    }
    return profile;
  }

  listUsers() {
    return this.profiles.listUsers();
  }

  async updateProfile(userId: string, input: ProfileInput) {
    const current = await this.profiles.findProfileByUserId(userId);
    if (!current) {
      throw new NotFoundError("User not found");
    }

    const phoneNumber = cleanPhone(input.phoneNumber);
    const previousPhone = typeof current.profile?.phoneNumber === "string" ? current.profile.phoneNumber : null;

    return this.profiles.updateProfile(userId, {
      name: cleanRequiredName(input.name),
      image: cleanText(input.image, 500, "image"),
      dateOfBirth: cleanDateOfBirth(input.dateOfBirth),
      gender: cleanText(input.gender, textLimits.gender, "gender"),
      phoneNumber,
      phoneVerified: previousPhone === phoneNumber && current.profile?.phoneVerified === true,
      country: cleanText(input.country, textLimits.country, "country"),
      province: cleanText(input.province, textLimits.province, "province"),
      district: cleanText(input.district, textLimits.district, "district"),
      ward: cleanText(input.ward, textLimits.ward, "ward"),
      addressLine: cleanText(input.addressLine, textLimits.addressLine, "addressLine"),
      bio: cleanText(input.bio, textLimits.bio, "bio"),
      facebookUrl: cleanUrl(input.facebookUrl, "facebookUrl"),
      linkedinUrl: cleanUrl(input.linkedinUrl, "linkedinUrl"),
      githubUrl: cleanUrl(input.githubUrl, "githubUrl"),
      websiteUrl: cleanUrl(input.websiteUrl, "websiteUrl"),
      occupation: cleanText(input.occupation, textLimits.occupation, "occupation"),
      organization: cleanText(input.organization, textLimits.organization, "organization"),
      education: cleanText(input.education, textLimits.education, "education"),
    });
  }
}

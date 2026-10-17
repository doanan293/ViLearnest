import { errorResponseSchema } from "../lib/errors.js";

export { errorResponseSchema };

export const idParamSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", minLength: 1 },
  },
} as const;

export const courseIdParamSchema = {
  type: "object",
  required: ["courseId"],
  properties: {
    courseId: { type: "string", minLength: 1 },
  },
} as const;

export const courseLevelSchema = {
  type: "string",
  enum: ["Beginner", "Intermediate", "Advanced"],
} as const;

export const courseStatusSchema = {
  type: "string",
  enum: ["Draft", "Published", "Archived"],
} as const;

const optionalText = { type: ["string", "null"] } as const;

// At least one language must carry a value with a non-space character for the given field.
// The branches avoid `type` so Ajv's type coercion cannot turn a null into "" while trying them.
const hasText = { not: { type: "null" }, pattern: "\\S" } as const;

export function requireOneLanguage(enField: string, viField: string) {
  return {
    anyOf: [
      { required: [enField], properties: { [enField]: hasText } },
      { required: [viField], properties: { [viField]: hasText } },
    ],
  } as const;
}

export const courseCreateBodySchema = {
  type: "object",
  required: ["fileKey", "price", "duration", "level", "category", "slug", "status"],
  additionalProperties: false,
  ...requireOneLanguage("titleEn", "titleVi"),
  properties: {
    titleEn: optionalText,
    titleVi: optionalText,
    smallDescriptionEn: optionalText,
    smallDescriptionVi: optionalText,
    descriptionEn: optionalText,
    descriptionVi: optionalText,
    fileKey: { type: "string", minLength: 1 },
    price: { type: "number", minimum: 0 },
    duration: { type: "number", minimum: 0 },
    level: courseLevelSchema,
    category: { type: "string", minLength: 1 },
    slug: { type: "string", minLength: 1 },
    status: courseStatusSchema,
  },
} as const;

export const courseSummarySchema = {
  type: "object",
  required: [
    "id",
    "title",
    "fileKey",
    "price",
    "duration",
    "level",
    "stripePriceId",
    "category",
    "slug",
    "status",
    "createdAt",
    "updatedAt",
    "userId",
  ],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    titleEn: optionalText,
    titleVi: optionalText,
    smallDescriptionEn: optionalText,
    smallDescriptionVi: optionalText,
    descriptionEn: optionalText,
    descriptionVi: optionalText,
    fileKey: { type: "string" },
    price: { type: "number" },
    duration: { type: "number" },
    level: courseLevelSchema,
    stripePriceId: { type: "string" },
    category: { type: "string" },
    slug: { type: "string" },
    status: courseStatusSchema,
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    userId: { type: "string" },
  },
} as const;

export const successMessageSchema = {
  type: "object",
  required: ["status", "message"],
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    message: { type: "string" },
  },
} as const;

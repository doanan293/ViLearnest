import { S3Client } from "@aws-sdk/client-s3";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import Stripe from "stripe";
import { config } from "../config/index.js";
import { db } from "../db/index.js";
import { CourseRepository } from "../db/repository/courseRepository.js";
import { ProfileRepository } from "../db/repository/profileRepository.js";
import { CourseService } from "../services/courseService.js";
import { ProfileService } from "../services/profileService.js";
import { StorageService } from "../services/storageService.js";

export interface AppServices {
  courses: CourseService;
  profiles: ProfileService;
  storage: StorageService;
  stripe: Stripe;
}

declare module "fastify" {
  interface FastifyInstance {
    services: AppServices;
  }
}

async function servicesPlugin(fastify: FastifyInstance) {
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: "2025-12-15.clover" as NonNullable<ConstructorParameters<typeof Stripe>[1]>["apiVersion"],
  });

  const s3 = new S3Client({
    region: config.awsRegion,
    endpoint: config.awsEndpointUrlS3,
    forcePathStyle: false,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  const courseRepository = new CourseRepository(db);
  const profileRepository = new ProfileRepository(db);

  fastify.decorate("services", {
    stripe,
    courses: new CourseService(courseRepository, stripe),
    profiles: new ProfileService(profileRepository),
    storage: new StorageService(s3),
  });
}

export default fp(servicesPlugin, { name: "services" });

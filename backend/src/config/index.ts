import { parseArcjetMode } from "./arcjet.js";

export const config = {
  port: Number(process.env.PORT) || 5000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:5000",
  arcjetKey: process.env.ARCJET_KEY || "ajkey_mock",
  arcjetMode: parseArcjetMode(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "mock-secret-key",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "mock-webhook-secret",
  s3BucketName: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES || process.env.AWS_BUCKET_NAME || "mock-bucket",
  awsRegion: process.env.AWS_REGION || "us-east-1",
  awsEndpointUrlS3: process.env.AWS_ENDPOINT_URL_S3,
};

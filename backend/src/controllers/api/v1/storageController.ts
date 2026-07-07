import type { FastifyRequest } from "fastify";
import type { StorageService } from "../../../services/storageService.js";
import { requireSession } from "../../../utils/auth.js";

export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  async createPresignedUploadUrl(request: FastifyRequest<{ Body: { filename: string; contentType: string } }>) {
    await requireSession(request);
    return this.storageService.createPresignedUploadUrl(request.body.filename, request.body.contentType);
  }

  async deleteFile(request: FastifyRequest<{ Body: { key: string } }>) {
    await requireSession(request);
    return this.storageService.deleteFile(request.body.key);
  }
}

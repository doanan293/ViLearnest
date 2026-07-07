import type { FastifyRequest } from "fastify";
import type { ProfileInput, ProfileService } from "../../../services/profileService.js";
import { requireAdmin } from "../../../utils/auth.js";

export class AdminUsersController {
  constructor(private readonly profileService: ProfileService) {}

  async listUsers(request: FastifyRequest) {
    await requireAdmin(request);
    return this.profileService.listUsers();
  }

  async getUserProfile(request: FastifyRequest<{ Params: { userId: string } }>) {
    await requireAdmin(request);
    return this.profileService.getProfile(request.params.userId);
  }

  async updateUserProfile(request: FastifyRequest<{ Params: { userId: string }; Body: ProfileInput }>) {
    await requireAdmin(request);
    return this.profileService.updateProfile(request.params.userId, request.body);
  }
}

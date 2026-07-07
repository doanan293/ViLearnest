import type { FastifyRequest } from "fastify";
import type { ProfileInput, ProfileService } from "../../../services/profileService.js";
import { requireSession } from "../../../utils/auth.js";

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  async getMe(request: FastifyRequest) {
    const session = await requireSession(request);
    return this.profileService.getProfile(session.user.id);
  }

  async updateMe(request: FastifyRequest<{ Body: ProfileInput }>) {
    const session = await requireSession(request);
    return this.profileService.updateProfile(session.user.id, request.body);
  }
}

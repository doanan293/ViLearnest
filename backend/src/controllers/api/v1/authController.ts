import { eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify";
import { db } from "../../../db/index.js";
import { user } from "../../../db/schema.js";
import { requireSession } from "../../../utils/auth.js";

export class AuthController {
  async getSession(request: FastifyRequest) {
    return requireSession(request);
  }

  async emailExists(body: { email: string }) {
    const email = body.email.trim().toLowerCase();
    const existingUser = await db.query.user.findFirst({
      columns: { id: true },
      where: eq(user.email, email),
    });

    return { exists: Boolean(existingUser) };
  }
}

import { fromNodeHeaders } from "better-auth/node";
import type { FastifyRequest } from "fastify";
import { auth } from "../auth.js";

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireSession(request: FastifyRequest) {
  const headers = fromNodeHeaders(request.headers);
  const session = await auth.api.getSession({ headers });
  if (!session) {
    throw new AuthError("Session expired or unauthorized", 401);
  }
  return session;
}

export async function requireAdmin(request: FastifyRequest) {
  const session = await requireSession(request);
  if (session.user.role !== "admin") {
    throw new AuthError("Access denied: Administrator privileges required", 403);
  }
  return session;
}

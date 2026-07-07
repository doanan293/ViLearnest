import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { HttpError } from "./errors.js";

export function globalErrorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({
      status: "error",
      message: error.message,
    });
  }

  const statusCode = (error as { statusCode?: number }).statusCode;
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return reply.status(statusCode).send({
      status: "error",
      message: error.message,
    });
  }

  request.log.error(error);
  return reply.status(500).send({
    status: "error",
    message: "Internal server error",
  });
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(404).send({
    status: "error",
    message: `Route ${request.method} ${request.url} not found`,
  });
}

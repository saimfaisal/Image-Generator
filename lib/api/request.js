import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError } from "./errors";

const requestIdPattern = /^[A-Za-z0-9._:-]{1,100}$/;

export function getRequestId(request) {
  const incoming = request.headers.get("x-request-id");
  return incoming && requestIdPattern.test(incoming) ? incoming : randomUUID();
}

export async function parseBody(request, schema) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error instanceof z.ZodError ? parsed.error.flatten().fieldErrors : undefined;
    throw new ApiError(400, "VALIDATION_ERROR", "Please check the submitted details.", { fields });
  }
  return parsed.data;
}

export function logRequest(request, { requestId, status, scope }) {
  console.info(JSON.stringify({
    event: "api.request",
    requestId,
    scope,
    method: request.method,
    path: new URL(request.url).pathname,
    status,
  }));
}

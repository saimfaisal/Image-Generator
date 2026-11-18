export class ApiError extends Error {
  constructor(status, code, message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = options.fields;
    this.cause = options.cause;
  }
}

export function isPrismaKnownError(error, code) {
  return error?.code === code;
}

export function errorResponse(error, { requestId }) {
  if (error instanceof ApiError) {
    return { status: error.status, code: error.code, message: error.message, fields: error.fields };
  }

  if (isPrismaKnownError(error, "P2002")) {
    return { status: 409, code: "CONFLICT", message: "A record with those details already exists." };
  }

  console.error(JSON.stringify({
    event: "api.unhandled_error",
    requestId,
    error: error instanceof Error ? error.message : "unknown_error",
  }));

  return { status: 500, code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." };
}

export function jsonError(error, { requestId }) {
  const normalized = errorResponse(error, { requestId });
  const body = {
    error: normalized.message,
    code: normalized.code,
    requestId,
  };
  if (normalized.fields) body.fields = normalized.fields;

  return Response.json(body, {
    status: normalized.status,
    headers: { "x-request-id": requestId },
  });
}

export function jsonSuccess(data, { requestId, status = 200 } = {}) {
  return Response.json({ ...data, requestId }, {
    status,
    headers: { "x-request-id": requestId },
  });
}

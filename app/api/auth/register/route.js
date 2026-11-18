import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validations/auth";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request) {
  const requestId = getRequestId(request);
  try {
    if (!process.env.DATABASE_URL) {
      throw new ApiError(503, "DATABASE_UNAVAILABLE", "Account creation is temporarily unavailable.");
    }
    const rate = await checkRateLimit({ request, scope: "auth.register", limit: 5, windowMs: 15 * 60_000 });
    // Registration must remain available before a user can be authenticated.
    // Expensive AI endpoints still fail closed when production rate limiting
    // is not configured, while account creation uses the local guard until a
    // distributed provider is approved and connected.
    if (!rate.unavailable && !rate.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many registration attempts. Please try again later.");
    const parsed = await parseBody(request, registrationSchema);
    const { name, password } = parsed;
    const email = parsed.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new ApiError(409, "CONFLICT", "Unable to create account with those details.");
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, passwordHash }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    const response = jsonSuccess({ user }, { requestId, status: 201 });
    logRequest(request, { requestId, scope: "auth.register", status: 201 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "auth.register", status: response.status });
    return response;
  }
}

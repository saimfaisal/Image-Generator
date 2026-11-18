import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { profileUpdateSchema } from "@/lib/validations/auth";

export async function GET(request) {
  const requestId = getRequestId(request);
  try {
    const sessionUser = await requireAuthenticatedUser();
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { id: true, name: true, email: true, image: true, role: true, emailVerified: true, createdAt: true } });
    if (!user) throw new ApiError(404, "NOT_FOUND", "User not found.");
    const response = jsonSuccess({ user }, { requestId });
    logRequest(request, { requestId, scope: "user.me", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "user.me", status: response.status });
    return response;
  }
}

export async function PATCH(request) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const parsed = await parseBody(request, profileUpdateSchema);
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name: parsed.name }, select: { id: true, name: true, email: true, image: true, role: true, emailVerified: true, createdAt: true } });
    const response = jsonSuccess({ user: updated }, { requestId });
    logRequest(request, { requestId, scope: "user.profile.update", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "user.profile.update", status: response.status });
    return response;
  }
}

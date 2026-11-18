import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { passwordChangeSchema } from "@/lib/validations/auth";

export async function POST(request) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const parsed = await parseBody(request, passwordChangeSchema);
    const stored = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!stored || !(await bcrypt.compare(parsed.currentPassword, stored.passwordHash))) {
      throw new ApiError(400, "INVALID_PASSWORD", "Current password is incorrect.");
    }
    const passwordHash = await bcrypt.hash(parsed.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    const response = jsonSuccess({ changed: true }, { requestId });
    logRequest(request, { requestId, scope: "user.password.change", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "user.password.change", status: response.status });
    return response;
  }
}

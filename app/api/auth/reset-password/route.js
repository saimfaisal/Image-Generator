import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { resetPasswordSchema } from "@/lib/validations/auth";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request) {
  const requestId = getRequestId(request);
  try {
    const parsed = await parseBody(request, resetPasswordSchema);
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.token) } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) throw new ApiError(400, "INVALID_RESET_TOKEN", "This reset link is invalid or expired.");
    const passwordHash = await bcrypt.hash(parsed.newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);
    const response = jsonSuccess({ message: "Password reset successfully." }, { requestId });
    logRequest(request, { requestId, scope: "auth.reset-password", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "auth.reset-password", status: response.status });
    return response;
  }
}

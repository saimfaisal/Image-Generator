import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { checkRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations/auth";

const GENERIC_MESSAGE = "If an account exists for that email, password reset instructions will be sent.";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function sendResetEmail({ email, resetUrl }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [email], subject: "Reset your PixelForge AI password", html: `<p>Reset your password using this link:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in one hour.</p>` }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request) {
  const requestId = getRequestId(request);
  try {
    const rate = await checkRateLimit({ request, scope: "auth.forgot-password", limit: 5, windowMs: 15 * 60_000 });
    if (!rate.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many reset requests. Please try again later.");
    const { email } = await parseBody(request, forgotPasswordSchema);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, email: true } });
    if (user) {
      const rawToken = randomBytes(32).toString("base64url");
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      const tokenRecord = await prisma.passwordResetToken.create({ data: { tokenHash: hashToken(rawToken), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60_000) } });
      const baseUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
      const sent = baseUrl ? await sendResetEmail({ email: user.email, resetUrl: `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}` }) : false;
      if (!sent) {
        await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });
        console.warn(JSON.stringify({ event: "auth.reset_email_unavailable", requestId }));
      }
    }
    const response = jsonSuccess({ message: GENERIC_MESSAGE }, { requestId });
    logRequest(request, { requestId, scope: "auth.forgot-password", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "auth.forgot-password", status: response.status });
    return response;
  }
}

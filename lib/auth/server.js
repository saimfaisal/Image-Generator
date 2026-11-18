import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";

export async function getAuthenticatedUser() {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    return await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, role: true, emailVerified: true, createdAt: true },
    });
  } catch (error) {
    // An unavailable/misconfigured production database or Auth.js secret must
    // not turn every protected page into an unhandled server exception.
    console.error(JSON.stringify({ event: "auth.session_read_failed", code: error?.code || "AUTH_SESSION_READ_FAILED" }));
    return null;
  }
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  return user;
}

export function requireRole(user, role) {
  if (user.role !== role) throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action.");
  return user;
}

export async function requireOwnedProject(id, userId) {
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) throw new ApiError(404, "NOT_FOUND", "Project not found.");
  return project;
}

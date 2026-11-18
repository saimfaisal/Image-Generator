import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest } from "@/lib/api/request";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { processVideoJob } from "@/lib/ai/video/jobs";
import { AiProviderError } from "@/lib/ai/errors";

export async function GET(request, { params }) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const id = (await params).id;
    const existing = await prisma.videoGeneration.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Video generation not found.");
    const video = existing.status === "PROCESSING" ? await processVideoJob(existing.id) : existing;
    const response = jsonSuccess({ video }, { requestId });
    logRequest(request, { requestId, scope: "videos.status", status: 200 });
    return response;
  } catch (error) {
    const safeError = error instanceof AiProviderError ? new ApiError(error.code === "GOOGLE_VERTEX_NOT_CONFIGURED" ? 503 : 502, error.code, "Video status is temporarily unavailable.") : error;
    const response = jsonError(safeError, { requestId });
    logRequest(request, { requestId, scope: "videos.status", status: response.status });
    return response;
  }
}

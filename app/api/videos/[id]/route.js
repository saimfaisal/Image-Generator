import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest } from "@/lib/api/request";
import { requireAuthenticatedUser } from "@/lib/auth/server";

async function ownedVideo(id, userId) {
  const video = await prisma.videoGeneration.findFirst({ where: { id, userId } });
  if (!video) throw new ApiError(404, "NOT_FOUND", "Video generation not found.");
  return video;
}

export async function GET(request, { params }) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const video = await ownedVideo((await params).id, user.id);
    const response = jsonSuccess({ video }, { requestId });
    logRequest(request, { requestId, scope: "videos.get", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "videos.get", status: response.status });
    return response;
  }
}

export async function DELETE(request, { params }) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const video = await ownedVideo((await params).id, user.id);
    if (video.status === "PROCESSING" || video.status === "PENDING") throw new ApiError(409, "VIDEO_IN_PROGRESS", "In-progress videos cannot be deleted until processing finishes.");
    await prisma.videoGeneration.delete({ where: { id: video.id } });
    const response = jsonSuccess({ deleted: true }, { requestId });
    logRequest(request, { requestId, scope: "videos.delete", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "videos.delete", status: response.status });
    return response;
  }
}

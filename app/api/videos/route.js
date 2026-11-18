import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { requireAuthenticatedUser, requireOwnedProject } from "@/lib/auth/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { googleVideoProvider } from "@/lib/ai/video/google";
import { getGoogleConfigStatus } from "@/lib/google/config";
import { videoCreateSchema } from "@/lib/validations/video";

function outputUri(videoId) {
  const bucket = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
  const prefix = (process.env.GOOGLE_VIDEO_OUTPUT_PREFIX || "pixelforge-video-output").replace(/^\/+|\/+$/g, "");
  return bucket ? `gs://${bucket}/${prefix}/${videoId}/` : null;
}

export async function GET(request) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const url = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));
    const cursor = url.searchParams.get("cursor") || undefined;
    const videos = await prisma.videoGeneration.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: limit + 1, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
    const hasMore = videos.length > limit;
    const items = hasMore ? videos.slice(0, limit) : videos;
    const response = jsonSuccess({ videos: items, nextCursor: hasMore ? items[items.length - 1].id : null }, { requestId });
    logRequest(request, { requestId, scope: "videos.list", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "videos.list", status: response.status });
    return response;
  }
}

export async function POST(request) {
  const requestId = getRequestId(request);
  let video;
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 100_000) throw new ApiError(413, "REQUEST_TOO_LARGE", "Video request is too large.");
    const user = await requireAuthenticatedUser();
    const rate = await checkRateLimit({ request, scope: "video.create", userId: user.id, limit: 3, windowMs: 60 * 60_000 });
    if (rate.unavailable) throw new ApiError(503, "RATE_LIMIT_UNAVAILABLE", "Video service is temporarily unavailable.");
    if (!rate.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many video requests. Please try again later.");
    const parsed = await parseBody(request, videoCreateSchema);
    if (parsed.projectId) await requireOwnedProject(parsed.projectId, user.id);
    if (!getGoogleConfigStatus().video.configured) throw new ApiError(503, "GOOGLE_VIDEO_NOT_CONFIGURED", "Video generation is not configured yet.");

    const recentDuplicate = await prisma.videoGeneration.findFirst({ where: { userId: user.id, prompt: parsed.prompt, aspectRatio: parsed.aspectRatio, status: { in: ["PENDING", "PROCESSING"] }, createdAt: { gte: new Date(Date.now() - 5 * 60_000) } }, orderBy: { createdAt: "desc" } });
    if (recentDuplicate) return jsonSuccess({ video: recentDuplicate, duplicate: true }, { requestId, status: 200 });

    video = await prisma.videoGeneration.create({ data: { userId: user.id, projectId: parsed.projectId || null, prompt: parsed.prompt, provider: googleVideoProvider.id, model: parsed.model || googleVideoProvider.model(), status: "PENDING", aspectRatio: parsed.aspectRatio, durationSeconds: parsed.durationSeconds, resolution: parsed.resolution } });
    const operation = await googleVideoProvider.start({ prompt: parsed.prompt, outputGcsUri: outputUri(video.id), aspectRatio: parsed.aspectRatio, durationSeconds: parsed.durationSeconds, resolution: parsed.resolution });
    const providerJobId = operation?.name || operation?.id || operation?.metadata?.name;
    if (!providerJobId) throw new ApiError(502, "GOOGLE_VIDEO_JOB_ID_MISSING", "Video service did not return a job identifier.");
    const updated = await prisma.videoGeneration.update({ where: { id: video.id }, data: { status: "PROCESSING", providerJobId } });
    const response = jsonSuccess({ video: updated }, { requestId, status: 202 });
    logRequest(request, { requestId, scope: "videos.create", status: 202 });
    return response;
  } catch (error) {
    if (video?.id) await prisma.videoGeneration.update({ where: { id: video.id }, data: { status: "FAILED", errorMessage: error.code || "VIDEO_START_FAILED" } }).catch(() => undefined);
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "videos.create", status: response.status });
    return response;
  }
}

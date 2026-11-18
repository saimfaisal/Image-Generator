import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest } from "@/lib/api/request";
import { processVideoJob } from "@/lib/ai/video/jobs";
import { AiProviderError } from "@/lib/ai/errors";
import { ApiError } from "@/lib/api/errors";

export async function POST(request) {
  const requestId = getRequestId(request);
  try {
    const expected = process.env.VIDEO_WORKER_SECRET;
    const provided = request.headers.get("x-video-worker-secret");
    if (!expected || !provided || provided !== expected) return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "x-request-id": requestId } });
    const url = new URL(request.url);
    const requestedId = url.searchParams.get("id");
    const jobs = requestedId ? await prisma.videoGeneration.findMany({ where: { id: requestedId, status: "PROCESSING" }, take: 1 }) : await prisma.videoGeneration.findMany({ where: { status: "PROCESSING", updatedAt: { lt: new Date(Date.now() - 10_000) } }, orderBy: { updatedAt: "asc" }, take: 10 });
    const results = [];
    for (const job of jobs) results.push(await processVideoJob(job.id));
    const response = jsonSuccess({ processed: results.length, videos: results.map((job) => ({ id: job.id, status: job.status })) }, { requestId });
    logRequest(request, { requestId, scope: "videos.worker", status: 200 });
    return response;
  } catch (error) {
    const safeError = error instanceof AiProviderError ? new ApiError(502, error.code, "Video worker could not process the provider job.") : error;
    const response = jsonError(safeError, { requestId });
    logRequest(request, { requestId, scope: "videos.worker", status: response.status });
    return response;
  }
}

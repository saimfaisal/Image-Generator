import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, jsonSuccess } from "@/lib/api/errors";
import { getRequestId, logRequest, parseBody } from "@/lib/api/request";
import { requireAuthenticatedUser, requireOwnedProject } from "@/lib/auth/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getImageProvider } from "@/lib/ai";
import { AiProviderError } from "@/lib/ai/errors";
import { storeGeneratedImage } from "@/lib/storage";
import { generationCreateSchema } from "@/lib/validations/generation";

const dimensions = { "1:1": [1024, 1024], "16:9": [1536, 864], "9:16": [864, 1536], "4:3": [1365, 1024], "3:4": [1024, 1365] };

function withTimeout(promise, milliseconds) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new AiProviderError("Image provider timed out.", { code: "AI_PROVIDER_TIMEOUT" })), milliseconds))]);
}

export async function GET(request) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuthenticatedUser();
    const generations = await prisma.generation.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
    const response = jsonSuccess({ generations }, { requestId });
    logRequest(request, { requestId, scope: "generations.list", status: 200 });
    return response;
  } catch (error) {
    const response = jsonError(error, { requestId });
    logRequest(request, { requestId, scope: "generations.list", status: response.status });
    return response;
  }
}

export async function POST(request) {
  const requestId = getRequestId(request);
  let generation;
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 100_000) throw new ApiError(413, "REQUEST_TOO_LARGE", "Generation request is too large.");
    const user = await requireAuthenticatedUser();
    const rate = await checkRateLimit({ request, scope: "generation.create", userId: user.id, limit: 10, windowMs: 60 * 60_000 });
    if (rate.unavailable) throw new ApiError(503, "RATE_LIMIT_UNAVAILABLE", "Generation service is temporarily unavailable.");
    if (!rate.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many generation requests. Please try again later.");
    const parsed = await parseBody(request, generationCreateSchema);
    if (parsed.projectId) await requireOwnedProject(parsed.projectId, user.id);
    const provider = getImageProvider();
    const model = parsed.model || process.env.GOOGLE_IMAGE_MODEL || process.env.AI_MODEL || "gemini-3.1-flash-image";
    const [width, height] = dimensions[parsed.aspectRatio];
    generation = await prisma.generation.create({ data: { prompt: parsed.prompt, provider: provider.id, model, status: "PENDING", width, height, aspectRatio: parsed.aspectRatio, quality: parsed.quality, imageCount: parsed.imageCount, userId: user.id, projectId: parsed.projectId || null } });
    await prisma.generation.update({ where: { id: generation.id }, data: { status: "PROCESSING" } });
    const outputs = await withTimeout(provider.generate({ prompt: parsed.prompt, aspectRatio: parsed.aspectRatio, quality: parsed.quality, imageCount: parsed.imageCount, model }), 30_000);
    const stored = await Promise.all(outputs.map((output) => storeGeneratedImage(output)));
    const updated = await prisma.$transaction(async (transaction) => {
      const result = await transaction.generation.update({ where: { id: generation.id }, data: { status: "COMPLETED", outputUrl: stored[0]?.url || null, outputUrls: stored.map((item) => item.url), completedAt: new Date(), errorMessage: null } });
      if (parsed.projectId && stored.length) await transaction.image.createMany({ data: stored.map((item, index) => ({ originalUrl: item.url, filename: `${generation.id}-${index + 1}.${item.mimeType?.split("/")[1] || "bin"}`, mimeType: item.mimeType || "application/octet-stream", width, height, projectId: parsed.projectId, userId: user.id })) });
      return result;
    });
    const response = jsonSuccess({ generation: updated, mock: provider.id === "mock" }, { requestId, status: 201 });
    logRequest(request, { requestId, scope: "generations.create", status: 201 });
    return response;
  } catch (error) {
    if (generation?.id) await prisma.generation.update({ where: { id: generation.id }, data: { status: "FAILED", errorMessage: error instanceof AiProviderError ? error.code : "GENERATION_FAILED" } }).catch(() => undefined);
    const providerStatus = error?.code === "GOOGLE_VERTEX_NOT_CONFIGURED" || error?.code === "GOOGLE_STORAGE_NOT_CONFIGURED" ? 503 : 502;
    const safeError = error instanceof AiProviderError ? new ApiError(providerStatus, error.code, providerStatus === 503 ? "Image generation is not configured yet." : "Image generation is temporarily unavailable.") : error;
    const response = jsonError(safeError, { requestId });
    logRequest(request, { requestId, scope: "generations.create", status: response.status });
    return response;
  }
}

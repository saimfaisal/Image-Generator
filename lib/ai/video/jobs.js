import { prisma } from "@/lib/prisma";
import { googleVideoProvider } from "@/lib/ai/video/google";
import { storeGeneratedVideo } from "@/lib/storage";

const MAX_PROVIDER_POLLS = 1;

export function getVideoOutputUri(operation) {
  return operation?.response?.generatedVideos?.[0]?.video?.uri || operation?.response?.generatedVideos?.[0]?.video?.gcsUri || null;
}

export async function processVideoJob(videoId) {
  const job = await prisma.videoGeneration.findUnique({ where: { id: videoId } });
  if (!job || !job.providerJobId || job.status === "COMPLETED" || job.status === "FAILED") return job;

  let operation = null;
  for (let attempt = 0; attempt < MAX_PROVIDER_POLLS; attempt += 1) {
    operation = await googleVideoProvider.poll({ name: job.providerJobId });
    if (operation?.done) break;
  }

  if (!operation?.done) return prisma.videoGeneration.update({ where: { id: videoId }, data: { status: "PROCESSING" } });
  if (operation.error) {
    return prisma.videoGeneration.update({ where: { id: videoId }, data: { status: "FAILED", errorMessage: "GOOGLE_VIDEO_FAILED" } });
  }

  const outputUri = getVideoOutputUri(operation);
  if (!outputUri) return prisma.videoGeneration.update({ where: { id: videoId }, data: { status: "FAILED", errorMessage: "VIDEO_OUTPUT_MISSING" } });

  try {
    const stored = await storeGeneratedVideo({ gcsUri: outputUri, videoId });
    return prisma.videoGeneration.update({ where: { id: videoId }, data: { status: "COMPLETED", outputGcsUri: stored.objectName || outputUri, outputUrl: stored.url, completedAt: new Date(), errorMessage: null } });
  } catch {
    return prisma.videoGeneration.update({ where: { id: videoId }, data: { status: "FAILED", outputGcsUri: outputUri, errorMessage: "VIDEO_STORAGE_FAILED" } });
  }
}

import { GoogleGenAI } from "@google/genai";
import { AiProviderError } from "@/lib/ai/errors";
import { getGoogleCloudConfig } from "@/lib/google/config";

function getClient() {
  const config = getGoogleCloudConfig();
  if (!config.project || !config.hasCredentialConfig) throw new AiProviderError("Google Vertex AI is not configured.", { code: "GOOGLE_VERTEX_NOT_CONFIGURED", retryable: false });
  const googleAuthOptions = config.credentials ? { credentials: config.credentials } : config.credentialsFile ? { keyFile: config.credentialsFile } : undefined;
  return new GoogleGenAI({ vertexai: true, project: config.project, location: config.location, googleAuthOptions });
}

export const googleVideoProvider = {
  id: "google-vertex-ai",
  model: () => process.env.GOOGLE_VIDEO_MODEL || "veo-3.1-fast-generate-001",
  async start({ prompt, outputGcsUri, aspectRatio = "16:9", durationSeconds = 8, resolution = "720p" }) {
    if (!outputGcsUri) throw new AiProviderError("A Google Cloud Storage output URI is required for Veo.", { code: "GOOGLE_VIDEO_OUTPUT_REQUIRED", retryable: false });
    try {
      return await getClient().models.generateVideos({ model: this.model(), prompt, config: { aspectRatio, durationSeconds, resolution, outputGcsUri } });
    } catch (error) { throw new AiProviderError("Google Veo job could not be started.", { code: "GOOGLE_VIDEO_START_FAILED", cause: error }); }
  },
  async poll(operation) {
    try { return await getClient().operations.get({ operation }); } catch (error) { throw new AiProviderError("Google Veo job status could not be read.", { code: "GOOGLE_VIDEO_STATUS_FAILED", cause: error }); }
  },
};

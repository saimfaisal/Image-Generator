import { GoogleGenAI } from "@google/genai";
import { AiProviderError } from "@/lib/ai/errors";
import { getGoogleCloudConfig } from "@/lib/google/config";

function getClient() {
  const config = getGoogleCloudConfig();
  if (!config.project || !config.hasCredentialConfig) throw new AiProviderError("Google Vertex AI is not configured.", { code: "GOOGLE_VERTEX_NOT_CONFIGURED", retryable: false });
  const googleAuthOptions = config.credentials ? { credentials: config.credentials } : config.credentialsFile ? { keyFile: config.credentialsFile } : undefined;
  return new GoogleGenAI({ vertexai: true, project: config.project, location: config.location, googleAuthOptions });
}

export const googleChatProvider = {
  id: "google-vertex-ai",
  model: () => process.env.GOOGLE_CHAT_MODEL || "gemini-3.1-flash",
  async generate({ contents }) {
    try { return await getClient().models.generateContent({ model: this.model(), contents }); } catch (error) { throw new AiProviderError("Google chat generation failed.", { code: "GOOGLE_CHAT_FAILED", cause: error }); }
  },
  async stream({ contents }) {
    try { return await getClient().models.generateContentStream({ model: this.model(), contents }); } catch (error) { throw new AiProviderError("Google chat stream failed.", { code: "GOOGLE_CHAT_STREAM_FAILED", cause: error }); }
  },
};

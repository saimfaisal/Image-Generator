import { GoogleGenAI } from "@google/genai";
import { AiProviderError } from "@/lib/ai/errors";
import { getGoogleCloudConfig } from "@/lib/google/config";

function getClient() {
  const config = getGoogleCloudConfig();
  if (!config.project || !config.hasCredentialConfig) throw new AiProviderError("Google Vertex AI is not configured.", { code: "GOOGLE_VERTEX_NOT_CONFIGURED", retryable: false });
  const googleAuthOptions = config.credentials ? { credentials: config.credentials } : config.credentialsFile ? { keyFile: config.credentialsFile } : undefined;
  return new GoogleGenAI({ vertexai: true, project: config.project, location: config.location, googleAuthOptions });
}

export const googleImageProvider = {
  id: "google-vertex-ai",
  async generate({ prompt, aspectRatio, imageCount = 1, quality }) {
    const client = getClient();
    const model = process.env.GOOGLE_IMAGE_MODEL || "gemini-3.1-flash-image";
    const results = [];
    for (let index = 0; index < imageCount; index += 1) {
      try {
        const response = await client.models.generateContent({ model, contents: prompt, config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio, imageSize: quality === "high" ? "2K" : "1K" } } });
        const inlineData = response.candidates?.flatMap((candidate) => candidate.content?.parts || []).find((part) => part.inlineData)?.inlineData;
        if (!inlineData?.data) throw new Error("No image data returned.");
        results.push({ dataUrl: `data:${inlineData.mimeType || "image/png"};base64,${inlineData.data}`, mimeType: inlineData.mimeType || "image/png" });
      } catch (error) {
        console.error(JSON.stringify({ event: "google.image_generation_failed", provider: "google-vertex-ai", error: error instanceof Error ? error.message : "unknown_error" }));
        throw new AiProviderError("Google image generation failed.", { code: "GOOGLE_IMAGE_GENERATION_FAILED" });
      }
    }
    return results;
  },
};

import { AiProviderError } from "@/lib/ai/errors";
import { googleImageProvider } from "@/lib/ai/providers/google";
import { mockImageProvider } from "@/lib/ai/providers/mock";

export function getImageProvider() {
  const provider = (process.env.AI_PROVIDER || "google").toLowerCase();
  if (provider === "google" || provider === "google-vertex-ai") return googleImageProvider;
  if (provider === "mock") return mockImageProvider;
  throw new AiProviderError(`Configured image provider is unavailable: ${provider}.`, { code: "AI_PROVIDER_UNAVAILABLE", retryable: false });
}

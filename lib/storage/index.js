import { AiProviderError } from "@/lib/ai/errors";
import { Storage } from "@google-cloud/storage";
import { getGoogleCloudConfig } from "@/lib/google/config";

const MAX_DATA_URL_BYTES = 2 * 1024 * 1024;

export async function storeGeneratedImage({ dataUrl, mimeType }) {
  const provider = (process.env.STORAGE_PROVIDER || "google-cloud-storage").toLowerCase();
  if (provider === "mock") {
    if (!dataUrl.startsWith(`data:${mimeType};base64,`) || Buffer.byteLength(dataUrl, "utf8") > MAX_DATA_URL_BYTES) throw new AiProviderError("Generated image failed storage validation.", { code: "STORAGE_VALIDATION_FAILED", retryable: false });
    return { url: dataUrl, provider: "mock", mimeType };
  }
  if (provider !== "google-cloud-storage") throw new AiProviderError(`Configured storage provider is unavailable: ${provider}.`, { code: "STORAGE_UNAVAILABLE", retryable: false });
  const config = getGoogleCloudConfig();
  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
  if (!bucketName || !config.hasCredentialConfig) throw new AiProviderError("Google Cloud Storage is not configured.", { code: "GOOGLE_STORAGE_NOT_CONFIGURED", retryable: false });
  if (!dataUrl.startsWith(`data:${mimeType};base64,`)) {
    throw new AiProviderError("Generated image failed storage validation.", { code: "STORAGE_VALIDATION_FAILED", retryable: false });
  }
  const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const buffer = Buffer.from(encoded, "base64");
  if (buffer.byteLength > 15 * 1024 * 1024) throw new AiProviderError("Generated image exceeds the storage size limit.", { code: "STORAGE_VALIDATION_FAILED", retryable: false });
  const objectName = `images/${crypto.randomUUID()}.${mimeType.split("/")[1] || "bin"}`;
  const storage = new Storage(config.credentials ? { projectId: config.project, credentials: config.credentials } : config.credentialsFile ? { projectId: config.project, keyFilename: config.credentialsFile } : { projectId: config.project });
  const file = storage.bucket(bucketName).file(objectName);
  await file.save(buffer, { resumable: false, metadata: { contentType: mimeType, cacheControl: "private, max-age=3600" } });
  const [url] = await file.getSignedUrl({ version: "v4", action: "read", expires: Date.now() + 60 * 60 * 1000 });
  return { url, provider: "google-cloud-storage", objectName, mimeType };
}

function parseGsUri(uri) {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(uri || "");
  if (!match) throw new AiProviderError("Generated video storage reference is invalid.", { code: "STORAGE_VALIDATION_FAILED", retryable: false });
  return { bucket: match[1], objectName: match[2] };
}

export async function storeGeneratedVideo({ gcsUri, videoId }) {
  const provider = (process.env.STORAGE_PROVIDER || "google-cloud-storage").toLowerCase();
  if (provider !== "google-cloud-storage") throw new AiProviderError("Video storage requires Google Cloud Storage.", { code: "STORAGE_UNAVAILABLE", retryable: false });
  const config = getGoogleCloudConfig();
  const destinationBucket = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
  if (!destinationBucket || !config.hasCredentialConfig) throw new AiProviderError("Google Cloud Storage is not configured.", { code: "GOOGLE_STORAGE_NOT_CONFIGURED", retryable: false });
  const source = parseGsUri(gcsUri);
  const storageOptions = config.credentials ? { projectId: config.project, credentials: config.credentials } : config.credentialsFile ? { projectId: config.project, keyFilename: config.credentialsFile } : { projectId: config.project };
  const storage = new Storage(storageOptions);
  const sourceFile = storage.bucket(source.bucket).file(source.objectName);
  const [metadata] = await sourceFile.getMetadata();
  if (Number(metadata.size || 0) > 500 * 1024 * 1024) throw new AiProviderError("Generated video exceeds the storage size limit.", { code: "STORAGE_VALIDATION_FAILED", retryable: false });
  const objectName = `videos/${videoId || crypto.randomUUID()}/${crypto.randomUUID()}.mp4`;
  const destinationFile = storage.bucket(destinationBucket).file(objectName);
  await sourceFile.copy(destinationFile, { metadata: { contentType: "video/mp4", cacheControl: "private, max-age=3600" } });
  const [url] = await destinationFile.getSignedUrl({ version: "v4", action: "read", expires: Date.now() + 60 * 60 * 1000 });
  return { url, objectName, mimeType: "video/mp4", provider: "google-cloud-storage" };
}

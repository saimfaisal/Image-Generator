export function getGoogleCloudConfig() {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const credentialsFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const useAdc = process.env.GOOGLE_USE_ADC === "true";
  let credentials;

  if (credentialsJson) {
    try { credentials = JSON.parse(credentialsJson); } catch { credentials = undefined; }
  }

  return { project, location, credentials, credentialsFile, useAdc, hasCredentialConfig: Boolean(credentials || credentialsFile || useAdc) };
}

export function getGoogleConfigStatus() {
  const config = getGoogleCloudConfig();
  const storageConfigured = Boolean(config.project && process.env.GOOGLE_CLOUD_STORAGE_BUCKET && config.hasCredentialConfig);
  const vertexConfigured = Boolean(config.project && config.location && config.hasCredentialConfig);
  return {
    provider: "google-vertex-ai",
    vertexAi: { configured: vertexConfigured, projectConfigured: Boolean(config.project), credentialsConfigured: config.hasCredentialConfig },
    storage: { provider: "google-cloud-storage", configured: storageConfigured, bucketConfigured: Boolean(process.env.GOOGLE_CLOUD_STORAGE_BUCKET) },
    video: { provider: "veo-3.1-fast", configured: vertexConfigured && storageConfigured },
  };
}

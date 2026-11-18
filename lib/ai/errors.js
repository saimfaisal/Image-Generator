export class AiProviderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "AiProviderError";
    this.code = options.code || "AI_PROVIDER_ERROR";
    this.retryable = options.retryable ?? true;
  }
}

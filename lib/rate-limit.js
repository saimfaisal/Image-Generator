// This adapter intentionally has no external dependency. The memory store is
// suitable only for local development; production remains unprotected until
// a shared provider is configured and approved.
const memoryBuckets = new Map();

function getClientKey(request, scope, userId) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${scope}:${userId || forwarded || "anonymous"}`;
}

export async function checkRateLimit({ request, scope, userId, limit = 10, windowMs = 60_000 }) {
  const isProduction = process.env.NODE_ENV === "production";
  const key = getClientKey(request, scope, userId);

  if (isProduction && process.env.RATE_LIMIT_PROVIDER !== "memory") {
    // Do not silently bypass expensive AI endpoints in production. A shared
    // provider can be connected here without changing the route contract.
    return { allowed: false, configured: false, unavailable: true, reason: "shared_rate_limit_provider_not_configured" };
  }

  const now = Date.now();
  const current = memoryBuckets.get(key);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  bucket.count += 1;
  memoryBuckets.set(key, bucket);

  return {
    allowed: bucket.count <= limit,
    configured: true,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

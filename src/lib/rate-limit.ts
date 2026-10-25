type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  options: RateLimitOptions,
  now = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetAt,
      retryAfterMs: 0,
    };
  }

  existing.count += 1;
  const allowed = existing.count <= options.limit;

  return {
    allowed,
    limit: options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterMs: allowed ? 0 : Math.max(0, existing.resetAt - now),
  };
}

export function resetRateLimit(key?: string): void {
  if (key === undefined) {
    buckets.clear();
    return;
  }
  buckets.delete(key);
}

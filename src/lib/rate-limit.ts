// Simple in-memory rate limiter for API routes
// Uses a sliding window approach per IP

const ipHits = new Map<string, number[]>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(ipHits.keys());
  for (const ip of keys) {
    const timestamps = ipHits.get(ip)!;
    const valid = timestamps.filter((t: number) => now - t < 60_000);
    if (valid.length === 0) ipHits.delete(ip);
    else ipHits.set(ip, valid);
  }
}, 5 * 60_000);22

/**
 * Check if a request from the given IP should be rate-limited.
 * @param ip - The client IP address
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds (default 60s)
 * @returns `true` if the request is allowed, `false` if rate-limited
 */
export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number = 60_000,
): boolean {
  const now = Date.now();
  const timestamps = ipHits.get(ip) ?? [];
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= limit) {
    return false; // rate limited
  }

  valid.push(now);
  ipHits.set(ip, valid);
  return true; // allowed
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return '127.0.0.1';
}

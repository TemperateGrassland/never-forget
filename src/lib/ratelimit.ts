import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit configurations for different endpoints
export const rateLimits = {
  // Strict limits for high-risk endpoints
  userRegistration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 attempts per hour per IP
    analytics: true,
  }),

  waitlist: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 submissions per hour per IP
    analytics: true,
  }),

  feedback: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 submissions per hour per user
    analytics: true,
  }),

  // Moderate limits for API endpoints
  whatsappWebhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, "1 m"), // 1000 requests per minute
    analytics: true,
  }),

  reminderCrud: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute per user
    analytics: true,
  }),

  profileUpdate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute per user
    analytics: true,
  }),

  // General API rate limit
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
    analytics: true,
  }),
};

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  
  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIP) return realIP;
  
  return "unknown";
}

// Helper function to create identifier for rate limiting
export function createIdentifier(type: "ip" | "user", value: string, endpoint?: string): string {
  if (endpoint) {
    return `${type}:${endpoint}:${value}`;
  }
  return `${type}:${value}`;
}

// Rate limiting middleware function
export async function checkRateLimit(
  ratelimiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    const { success, limit, remaining, reset } = await ratelimiter.limit(identifier);
    
    return {
      success,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // In case of Redis errors, allow the request but log the error
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }
}

// Helper to create rate limit response headers
export function createRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}
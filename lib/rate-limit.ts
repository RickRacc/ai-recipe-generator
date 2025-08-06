import { RateLimiterMemory } from 'rate-limiter-flexible';
import { RATE_LIMITS } from './constants';

// In-memory rate limiter (use Redis in production)
const rateLimiterGuest = new RateLimiterMemory({
  points: RATE_LIMITS.GUEST_REQUESTS_PER_HOUR,
  duration: 3600, // 1 hour
});

const rateLimiterUser = new RateLimiterMemory({
  points: RATE_LIMITS.USER_REQUESTS_PER_HOUR,
  duration: 3600, // 1 hour
});

const rateLimiterValidation = new RateLimiterMemory({
  points: RATE_LIMITS.VALIDATION_REQUESTS_PER_MINUTE,
  duration: 60, // 1 minute
});

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // seconds to wait before next attempt
};

export async function checkRateLimit(
  identifier: string,
  isAuthenticated: boolean = false
): Promise<RateLimitResult> {
  const limiter = isAuthenticated ? rateLimiterUser : rateLimiterGuest;
  const key = `recipe_generation:${identifier}`;
  
  try {
    const result = await limiter.get(key);
    const limit = isAuthenticated ? RATE_LIMITS.USER_REQUESTS_PER_HOUR : RATE_LIMITS.GUEST_REQUESTS_PER_HOUR;
    const remaining = Math.max(0, limit - ((result as any)?.totalHits || 0));
    const resetTime = new Date(Date.now() + ((result as any)?.msBeforeNext || 0));
    
    return {
      allowed: true,
      limit,
      remaining: remaining - 1, // Account for current request
      resetTime,
    };
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    const limit = isAuthenticated ? RATE_LIMITS.USER_REQUESTS_PER_HOUR : RATE_LIMITS.GUEST_REQUESTS_PER_HOUR;
    
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTime: new Date(Date.now() + rejRes.msBeforeNext),
      retryAfter: secs,
    };
  }
}

export async function consumeRateLimit(
  identifier: string,
  isAuthenticated: boolean = false
): Promise<RateLimitResult> {
  const limiter = isAuthenticated ? rateLimiterUser : rateLimiterGuest;
  const key = `recipe_generation:${identifier}`;
  
  try {
    const result = await limiter.consume(key);
    const limit = isAuthenticated ? RATE_LIMITS.USER_REQUESTS_PER_HOUR : RATE_LIMITS.GUEST_REQUESTS_PER_HOUR;
    const remaining = Math.max(0, limit - (result as any).totalHits);
    const resetTime = new Date(Date.now() + (result as any).msBeforeNext);
    
    return {
      allowed: true,
      limit,
      remaining,
      resetTime,
    };
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    const limit = isAuthenticated ? RATE_LIMITS.USER_REQUESTS_PER_HOUR : RATE_LIMITS.GUEST_REQUESTS_PER_HOUR;
    
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTime: new Date(Date.now() + rejRes.msBeforeNext),
      retryAfter: secs,
    };
  }
}

export async function checkValidationRateLimit(identifier: string): Promise<RateLimitResult> {
  const key = `validation:${identifier}`;
  
  try {
    const result = await rateLimiterValidation.get(key);
    const remaining = Math.max(0, RATE_LIMITS.VALIDATION_REQUESTS_PER_MINUTE - ((result as any)?.totalHits || 0));
    const resetTime = new Date(Date.now() + ((result as any)?.msBeforeNext || 0));
    
    return {
      allowed: true,
      limit: RATE_LIMITS.VALIDATION_REQUESTS_PER_MINUTE,
      remaining: remaining - 1,
      resetTime,
    };
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    return {
      allowed: false,
      limit: RATE_LIMITS.VALIDATION_REQUESTS_PER_MINUTE,
      remaining: 0,
      resetTime: new Date(Date.now() + rejRes.msBeforeNext),
      retryAfter: secs,
    };
  }
}

export async function consumeValidationRateLimit(identifier: string): Promise<RateLimitResult> {
  const key = `validation:${identifier}`;
  
  try {
    const result = await rateLimiterValidation.consume(key);
    const remaining = Math.max(0, RATE_LIMITS.VALIDATION_REQUESTS_PER_MINUTE - (result as any).totalHits);
    const resetTime = new Date(Date.now() + (result as any).msBeforeNext);
    
    return {
      allowed: true,
      limit: RATE_LIMITS.VALIDATION_REQUESTS_PER_MINUTE,
      remaining,
      resetTime,
    };
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    return {
      allowed: false,
      limit: RATE_LIMITS.VALIDATION_REQUESTS_PER_MINUTE,
      remaining: 0,
      resetTime: new Date(Date.now() + rejRes.msBeforeNext),
      retryAfter: secs,
    };
  }
}

// Helper to get client IP for rate limiting
export function getClientIP(request: Request): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfIP) {
    return cfIP;
  }
  
  // Fallback - this might not be accurate in production
  return 'unknown-ip';
}
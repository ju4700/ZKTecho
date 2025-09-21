import { NextRequest } from 'next/server'
import { RateLimitError } from './errors'
import config from './config'

/**
 * Rate Limiting System
 * Simple in-memory rate limiter (use Redis in production)
 */

interface RateLimitInfo {
  count: number
  resetTime: number
}

class RateLimiter {
  private store = new Map<string, RateLimitInfo>()
  private windowMs: number
  private maxRequests: number

  constructor() {
    const securityConfig = config.get('security')
    this.windowMs = securityConfig.rateLimitWindow
    this.maxRequests = securityConfig.rateLimitRequests
  }

  private getKey(request: NextRequest): string {
    // In production, use a more sophisticated key generation
    // Consider: IP + User ID + Endpoint
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown'
    return `rate_limit:${ip}`
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, info] of this.store.entries()) {
      if (now > info.resetTime) {
        this.store.delete(key)
      }
    }
  }

  public check(request: NextRequest): {
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
  } {
    this.cleanup()

    const key = this.getKey(request)
    const now = Date.now()
    const resetTime = now + this.windowMs

    let info = this.store.get(key)

    if (!info || now > info.resetTime) {
      info = {
        count: 0,
        resetTime
      }
    }

    info.count++
    this.store.set(key, info)

    const allowed = info.count <= this.maxRequests
    const remaining = Math.max(0, this.maxRequests - info.count)

    return {
      allowed,
      limit: this.maxRequests,
      remaining,
      resetTime: info.resetTime
    }
  }

  public checkAndThrow(request: NextRequest): void {
    const result = this.check(request)
    
    if (!result.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`
      )
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

/**
 * Rate limiting decorator for API routes
 */
export function withRateLimit<R>(
  handler: (request: NextRequest) => Promise<R>
) {
  return async (request: NextRequest): Promise<R> => {
    rateLimiter.checkAndThrow(request)
    return handler(request)
  }
}

export default rateLimiter
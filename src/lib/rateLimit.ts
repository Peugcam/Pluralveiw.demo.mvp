import { LRUCache } from 'lru-cache';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { AuthenticatedApiRequest } from '@/types/api';

/**
 * Rate Limiter usando LRU Cache
 * Protege APIs contra abuso de requisições
 */

interface RateLimiterOptions {
  interval?: number;
  uniqueTokenPerInterval?: number;
  maxRequests?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

class RateLimiter {
  private options: Required<RateLimiterOptions>;
  private cache: LRUCache<string, number>;

  constructor(options: RateLimiterOptions = {}) {
    this.options = {
      interval: options.interval || 60 * 1000, // 1 minuto por padrão
      uniqueTokenPerInterval: options.uniqueTokenPerInterval || 500,
      maxRequests: options.maxRequests || 10, // 10 requisições por minuto
    };

    this.cache = new LRUCache({
      max: this.options.uniqueTokenPerInterval,
      ttl: this.options.interval,
    });
  }

  /**
   * Verifica se a requisição está dentro do limite
   * @param identifier - Identificador único (IP, user ID, etc)
   * @returns Informações sobre o rate limit
   */
  check(identifier: string): RateLimitResult {
    const tokenCount = (this.cache.get(identifier) || 0) + 1;
    const now = Date.now();
    const reset = now + this.options.interval;

    if (tokenCount > this.options.maxRequests) {
      return {
        success: false,
        remaining: 0,
        reset: reset,
        limit: this.options.maxRequests
      };
    }

    this.cache.set(identifier, tokenCount);

    return {
      success: true,
      remaining: this.options.maxRequests - tokenCount,
      reset: reset,
      limit: this.options.maxRequests
    };
  }

  /**
   * Middleware para Next.js API Routes
   */
  middleware(req: NextApiRequest, res: NextApiResponse): boolean {
    // Usar IP ou user ID como identificador
    const identifier = this.getIdentifier(req);
    const result = this.check(identifier);

    // Adicionar headers de rate limit
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(result.reset).toISOString());

    if (!result.success) {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
      });
      return false;
    }

    return true;
  }

  /**
   * Obtém identificador único da requisição
   */
  private getIdentifier(req: NextApiRequest | AuthenticatedApiRequest): string {
    // Priorizar user_id se autenticado
    const authReq = req as AuthenticatedApiRequest;
    if (authReq.user && authReq.user.id) {
      return `user:${authReq.user.id}`;
    }

    // Usar IP como fallback
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
      : req.socket.remoteAddress;
    return `ip:${ip}`;
  }
}

// Criar diferentes rate limiters para diferentes endpoints
export const apiRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minuto
  maxRequests: 10, // 10 requisições por minuto
});

export const analyzeRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minuto
  maxRequests: 5, // 5 análises por minuto (mais restritivo devido ao custo)
});

export const feedbackRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minuto
  maxRequests: 30, // 30 feedbacks por minuto
});

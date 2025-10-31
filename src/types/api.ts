import type { NextApiRequest, NextApiResponse } from 'next';
import type { APIError } from './index';

// ============================================================================
// Next.js API Types
// ============================================================================

// Extended Next.js API request with optional user context
export interface AuthenticatedApiRequest extends NextApiRequest {
  user?: {
    id: string;
    email?: string;
  };
}

// Generic API response handler type
export type APIHandler<T = any> = (
  req: NextApiRequest,
  res: NextApiResponse<T | APIError>
) => Promise<void> | void;

// Authenticated API handler type
export type AuthenticatedAPIHandler<T = any> = (
  req: AuthenticatedApiRequest,
  res: NextApiResponse<T | APIError>
) => Promise<void> | void;

// Rate limit info attached to request
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitedApiRequest extends NextApiRequest {
  rateLimit?: RateLimitInfo;
}

// Middleware types
export type Middleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => Promise<void> | void;

export type AsyncMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<boolean>;

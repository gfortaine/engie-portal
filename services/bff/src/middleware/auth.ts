import type { IncomingMessage } from 'node:http';

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
}

/**
 * Demo auth middleware — in production, this would validate JWT from
 * Authorization header via OIDC provider (e.g., ENGIE's SSO).
 *
 * For demo, it always returns a mock authenticated user.
 * Set REQUIRE_AUTH=true to require Bearer token header.
 */
export function extractAuthContext(req: IncomingMessage): AuthContext {
  const authHeader = req.headers.authorization;

  if (process.env.REQUIRE_AUTH === 'true') {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid Authorization header');
    }

    // In production: validate JWT, decode claims, check expiry
    // For demo: any Bearer token is accepted
    const _token = authHeader.slice(7);
  }

  // Return mock user for demo
  return {
    userId: 'user_001',
    email: 'marie.dupont@engie.com',
    name: 'Marie Dupont',
    tenantId: 'engie-france',
    roles: ['customer', 'admin'],
  };
}

export class AuthError extends Error {
  public readonly statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

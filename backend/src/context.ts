import { inferAsyncReturnType } from '@trpc/server';
import { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import jwt from 'jsonwebtoken';

function getJWTSecret() {
  const secret = process.env.JWT_SECRET || 'change-me-in-production';
  return secret;
}

export const createContext = async ({ req, res }: CreateHTTPContextOptions) => {
  // Extract and verify user token if present
  let user: { userId: string; type: string } | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, getJWTSecret()) as { userId?: string; type?: string };
      if (decoded.userId && decoded.type === 'user') {
        user = { userId: decoded.userId, type: decoded.type };
      }
    } catch {
      // Invalid token, user remains null
    }
  }

  return {
    req,
    res,
    user,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;

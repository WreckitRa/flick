import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Read env vars lazily (inside functions) to ensure dotenv.config() has run
function getJWTSecret() {
  const secret = process.env.JWT_SECRET || 'change-me-in-production';
  if (secret === 'change-me-in-production') {
    console.warn('[Admin Router] ⚠️  JWT_SECRET not set, using default (INSECURE!)');
  }
  return secret;
}

function getAdminPasswordHash() {
  const hash = process.env.ADMIN_PASSWORD_HASH || '';
  if (!hash) {
    console.error('[Admin Router] ✗ ADMIN_PASSWORD_HASH not set in .env file!');
    console.error(
      '[Admin Router] Run: pnpm --filter @flick/backend generate-password-hash <password>'
    );
  }
  return hash;
}

// Helper to hash password (run once to generate hash for .env)
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export const adminRouter = router({
  login: publicProcedure
    .input(
      z.object({
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log('Login attempt - input:', input);
      console.log('Request method:', ctx.req.method);
      console.log('Request headers:', ctx.req.headers);

      const ADMIN_PASSWORD_HASH = getAdminPasswordHash();
      if (!ADMIN_PASSWORD_HASH) {
        throw new Error('Admin password not configured. Add ADMIN_PASSWORD_HASH to .env file.');
      }

      if (!input.password) {
        throw new Error('Password is required');
      }

      const isValid = bcrypt.compareSync(input.password, ADMIN_PASSWORD_HASH);
      if (!isValid) {
        throw new Error('Invalid password');
      }

      const token = jwt.sign({ role: 'admin' }, getJWTSecret(), {
        expiresIn: '7d',
      });

      console.log('✓ Login successful, returning token');
      return {
        success: true,
        token,
      };
    }),

  verify: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { authenticated: false };
    }

    try {
      jwt.verify(token, getJWTSecret());
      return { authenticated: true };
    } catch {
      return { authenticated: false };
    }
  }),
});

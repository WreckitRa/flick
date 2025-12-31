import { initTRPC } from '@trpc/server';
import { Context } from './context';
// Removed superjson to avoid React Native compatibility issues
// Dates will be serialized as ISO strings manually in responses

const t = initTRPC.context<Context>().create({
  // No transformer - dates will be serialized as ISO strings
});

export const router = t.router;

// Logging middleware
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();

  try {
    const result = await next();
    const durationMs = Date.now() - start;
    console.log(`✓ ${type}.${path} (${durationMs}ms)`);
    return result;
  } catch (error: any) {
    const durationMs = Date.now() - start;
    console.error(`✗ ${type}.${path} (${durationMs}ms): ${error?.message || 'Unknown error'}`);
    throw error;
  }
});

// Public procedure with logging
export const publicProcedure = t.procedure.use(loggingMiddleware);

// Protected procedure (requires authentication)
export const protectedProcedure = t.procedure.use(loggingMiddleware).use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Unauthorized');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type narrowing
    },
  });
});

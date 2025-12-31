import { router, publicProcedure } from './trpc';
import { adminRouter } from './routers/admin';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { surveyRouter } from './routers/survey';

// Create main app router
export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok',
    message: 'Flick Backend is running',
    timestamp: new Date().toISOString(),
  })),
  admin: adminRouter,
  auth: authRouter,
  user: userRouter,
  survey: surveyRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;

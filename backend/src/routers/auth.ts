import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function getJWTSecret() {
  const secret = process.env.JWT_SECRET || 'change-me-in-production';
  if (secret === 'change-me-in-production') {
    console.warn('[Auth Router] ⚠️  JWT_SECRET not set, using default (INSECURE!)');
  }
  return secret;
}

// Helper to hash password
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

// Helper to verify password
function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Helper to generate JWT token for user
function generateUserToken(userId: string): string {
  return jwt.sign({ userId, type: 'user' }, getJWTSecret(), {
    expiresIn: '30d',
  });
}

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        phone: z.string().min(1).optional(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        guestUserId: z.string().optional(), // Optional: guest user ID to transfer data from
      })
    )
    .mutation(async ({ input }) => {
      // Validate that at least one identifier is provided
      if (!input.email && !input.phone) {
        throw new Error('Either email or phone number is required');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(input.email ? [{ email: input.email }] : []),
            ...(input.phone ? [{ phone: input.phone }] : []),
          ],
        },
      });

      if (existingUser) {
        throw new Error(
          existingUser.email === input.email
            ? 'An account with this email already exists'
            : 'An account with this phone number already exists'
        );
      }

      // Hash password
      const passwordHash = hashPassword(input.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: input.email,
          phone: input.phone,
          passwordHash,
          roles: ['USER'],
        },
      });

      // Create profile
      await prisma.profile.create({
        data: {
          userId: user.id,
        },
      });

      // Transfer guest data if guestUserId is provided
      let hasGuestData = false;
      let guestCoinsTransferred = 0;
      const guestUserId = input.guestUserId;
      
      if (guestUserId) {
        try {
          // Verify it's a guest user
          const guestUser = await prisma.user.findUnique({
            where: { id: guestUserId },
            include: {
              points: true,
            },
          });

          if (guestUser && guestUser.email?.startsWith('guest_') && guestUser.email?.endsWith('@flick.guest')) {
            // Calculate total coins from guest user
            guestCoinsTransferred = guestUser.points.reduce((sum, point) => sum + point.amount, 0);

            // Transfer all answers from guest user to new user
            await prisma.userAnswer.updateMany({
              where: { userId: guestUserId },
              data: { userId: user.id },
            });

            // Transfer all points from guest user to new user
            await prisma.userPoint.updateMany({
              where: { userId: guestUserId },
              data: { userId: user.id },
            });

            // Delete the guest user account
            await prisma.user.delete({
              where: { id: guestUserId },
            });

            hasGuestData = true;
            console.log(`[Signup] Transferred guest data from ${guestUserId} to ${user.id} (${guestCoinsTransferred} coins)`);
          }
        } catch (error) {
          console.error('[Signup] Error transferring guest data:', error);
          // Don't fail signup if transfer fails
        }
      }

      // Check onboarding status (from profile)
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });
      const onboardingCompleted = profile?.onboardingCompleted || false;

      // Generate token
      const token = generateUserToken(user.id);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
        },
        hasGuestData,
        guestCoinsTransferred,
        onboardingCompleted,
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        phone: z.string().min(1).optional(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.email && !input.phone) {
        throw new Error('Either email or phone number is required');
      }

      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(input.email ? [{ email: input.email }] : []),
            ...(input.phone ? [{ phone: input.phone }] : []),
          ],
        },
        include: {
          profile: true,
        },
      });

      if (!user || !user.passwordHash) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValid = verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      if (user.profile) {
        await prisma.profile.update({
          where: { id: user.profile.id },
          data: { lastLoginAt: new Date() },
        });
      }

      // Check if user has recent answers/points (might indicate recent guest transfer)
      // Check for answers/points created in the last 5 minutes (recent signup after guest survey)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const recentAnswers = await prisma.userAnswer.findFirst({
        where: {
          userId: user.id,
          submittedAt: {
            gte: fiveMinutesAgo,
          },
        },
      });

      const recentPoints = await prisma.userPoint.findFirst({
        where: {
          userId: user.id,
          createdAt: {
            gte: fiveMinutesAgo,
          },
        },
      });

      const hasGuestData = !!(recentAnswers || recentPoints);
      const onboardingCompleted = user.profile?.onboardingCompleted || false;

      // Generate token
      const token = generateUserToken(user.id);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          displayName: user.displayName,
        },
        hasGuestData,
        onboardingCompleted,
      };
    }),

  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string().min(1, 'Password is required to confirm account deletion'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;

      // Find user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.passwordHash) {
        throw new Error('Account cannot be deleted. Please contact support.');
      }

      // Verify password
      const isValid = verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid password. Please enter your current password to confirm account deletion.');
      }

      // Delete user (cascade will delete profile, answers, points, etc.)
      await prisma.user.delete({
        where: { id: userId },
      });

      return {
        success: true,
        message: 'Your account has been permanently deleted. We\'re sorry to see you go.',
      };
    }),

  // Get current user info
  // Check if device has completed onboarding (public, for device tracking)
  checkDeviceOnboarding: publicProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ input }) => {
      const device = await prisma.device.findUnique({
        where: { deviceId: input.deviceId },
      });

      return {
        onboardingCompleted: device?.onboardingCompleted || false,
      };
    }),

  // Mark device onboarding as completed (public, for device tracking)
  completeDeviceOnboarding: publicProcedure
    .input(z.object({ deviceId: z.string() }))
    .mutation(async ({ input }) => {
      // Upsert device record
      const device = await prisma.device.upsert({
        where: { deviceId: input.deviceId },
        update: {
          onboardingCompleted: true,
        },
        create: {
          deviceId: input.deviceId,
          onboardingCompleted: true,
        },
      });

      return {
        success: true,
        onboardingCompleted: device.onboardingCompleted,
      };
    }),

  // Reset device onboarding status (public, for dev reset)
  resetDeviceOnboarding: publicProcedure
    .input(z.object({ deviceId: z.string() }))
    .mutation(async ({ input }) => {
      // Update device record to reset onboarding
      const device = await prisma.device.updateMany({
        where: { deviceId: input.deviceId },
        data: {
          onboardingCompleted: false,
        },
      });

      return {
        success: true,
        updated: device.count > 0,
      };
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        displayName: true,
        createdAt: true,
        profile: {
          select: {
            country: true,
            onboardingCompleted: true,
            marketingOptIn: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
      profile: user.profile
        ? {
            country: user.profile.country,
            onboardingCompleted: user.profile.onboardingCompleted,
            marketingOptIn: user.profile.marketingOptIn,
            lastLoginAt: user.profile.lastLoginAt?.toISOString() || null,
          }
        : null,
    };
  }),
});


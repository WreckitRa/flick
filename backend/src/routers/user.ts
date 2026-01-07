import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

// Helper to hash password
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export const userRouter = router({
  // Get all users (for admin)
  list: publicProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          search: z.string().optional(),
        })
        .optional()
        .default({})
    )
    .query(async ({ input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
              { displayName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            profile: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.user.count({ where }),
      ]);

      // Calculate totalCoins for each user
      const usersWithCoins = await Promise.all(
        users.map(async (user) => {
          const totalCoinsResult = await prisma.userPoint.aggregate({
            where: { userId: user.id },
            _sum: { amount: true },
          });
          const totalCoins = totalCoinsResult._sum.amount || 0;
          return { ...user, totalCoins };
        })
      );

      return {
        users: usersWithCoins.map((user) => ({
          id: user.id,
          email: user.email,
          phone: user.phone,
          displayName: user.displayName,
          roles: user.roles,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          profile: user.profile
            ? {
                country: user.profile.country,
                onboardingCompleted: user.profile.onboardingCompleted,
                marketingOptIn: user.profile.marketingOptIn,
                lastLoginAt: user.profile.lastLoginAt?.toISOString() || null,
                gender: user.profile.gender,
                ageBucket: user.profile.ageBucket,
                profileCompletionRewardGiven: user.profile.profileCompletionRewardGiven,
                currentStreak: user.profile.currentStreak,
                longestStreak: user.profile.longestStreak,
                lastDailySurveyDate: user.profile.lastDailySurveyDate?.toISOString() || null,
                totalCoins: user.totalCoins,
              }
            : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get single user (for admin)
  get: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input.id },
      include: {
        profile: true,
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
      photoUrl: user.photoUrl,
      roles: user.roles,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profile: user.profile
        ? {
            ...user.profile,
            lastLoginAt: user.profile.lastLoginAt?.toISOString() || null,
            createdAt: user.profile.createdAt.toISOString(),
            updatedAt: user.profile.updatedAt.toISOString(),
            lastDailySurveyDate: user.profile.lastDailySurveyDate?.toISOString() || null,
          }
        : null,
    };
  }),

  // Create user (for admin)
  create: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        phone: z.string().min(1).optional(),
        password: z.string().min(8),
        displayName: z.string().optional(),
        roles: z.array(z.enum(['USER', 'ADMIN', 'AGENCY', 'MERCHANT'])).optional(),
      })
    )
    .mutation(async ({ input }) => {
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
          displayName: input.displayName,
          roles: input.roles || ['USER'],
        },
      });

      // Create profile
      await prisma.profile.create({
        data: {
          userId: user.id,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          displayName: user.displayName,
          roles: user.roles,
        },
      };
    }),

  // Update user (for admin)
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        password: z.string().min(8).optional(),
        displayName: z.string().optional(),
        roles: z.array(z.enum(['USER', 'ADMIN', 'AGENCY', 'MERCHANT'])).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, password, ...updateData } = input;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // If email or phone is being updated, check for conflicts
      if (updateData.email || updateData.phone) {
        const conflictingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  ...(updateData.email ? [{ email: updateData.email }] : []),
                  ...(updateData.phone ? [{ phone: updateData.phone }] : []),
                ],
              },
            ],
          },
        });

        if (conflictingUser) {
          throw new Error('Email or phone number already in use');
        }
      }

      // Prepare update data
      const dataToUpdate: any = { ...updateData };

      // Hash password if provided
      if (password) {
        dataToUpdate.passwordHash = hashPassword(password);
      }

      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: dataToUpdate,
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          displayName: user.displayName,
          roles: user.roles,
        },
      };
    }),

  // Delete user (for admin)
  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Delete user (cascade will delete profile)
    await prisma.user.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }),
});


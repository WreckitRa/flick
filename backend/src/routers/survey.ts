import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { prisma } from '../lib/prisma';

export const surveyRouter = router({
  // Admin: List all surveys
  list: publicProcedure
    .input(
      z
        .object({
          type: z.enum(['GUEST', 'DAILY']).optional(),
          published: z.boolean().optional(),
        })
        .optional()
        .default({})
    )
    .query(async ({ input }) => {
      const surveys = await prisma.survey.findMany({
        where: {
          ...(input.type && { type: input.type }),
          ...(input.published !== undefined && { published: input.published }),
        },
        include: {
          questions: {
            include: {
              options: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              answers: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      });

      return surveys.map((survey) => ({
        id: survey.id,
        title: survey.title,
        description: survey.description,
        type: survey.type,
        published: survey.published,
        isGuestSurvey: survey.isGuestSurvey,
        coinsReward: survey.coinsReward,
        order: survey.order,
        questionCount: survey.questions.length,
        answerCount: survey._count.answers,
        createdAt: survey.createdAt.toISOString(),
        updatedAt: survey.updatedAt.toISOString(),
        questions: survey.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          order: q.order,
          coinsReward: q.coinsReward,
          explanation: q.explanation,
          optionCount: q.options.length,
        })),
      }));
    }),

  // Admin: Get single survey with full details
  get: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const survey = await prisma.survey.findUnique({
      where: { id: input.id },
      include: {
        questions: {
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      type: survey.type,
      published: survey.published,
      isGuestSurvey: survey.isGuestSurvey,
      coinsReward: survey.coinsReward,
      order: survey.order,
      createdAt: survey.createdAt.toISOString(),
      updatedAt: survey.updatedAt.toISOString(),
      questions: survey.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        order: q.order,
        coinsReward: q.coinsReward,
        explanation: q.explanation,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            emoji: o.emoji,
            order: o.order,
          })),
      })),
    };
  }),

  // Admin: Create survey
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(['GUEST', 'DAILY']),
        coinsReward: z.number().int().min(0).default(10),
      })
    )
    .mutation(async ({ input }) => {
      const survey = await prisma.survey.create({
        data: {
          title: input.title,
          description: input.description,
          type: input.type,
          coinsReward: input.coinsReward,
          published: false,
          isGuestSurvey: false,
        },
      });

      return {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        type: survey.type,
        published: survey.published,
        isGuestSurvey: survey.isGuestSurvey,
        coinsReward: survey.coinsReward,
        createdAt: survey.createdAt.toISOString(),
        updatedAt: survey.updatedAt.toISOString(),
      };
    }),

  // Admin: Update survey
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        type: z.enum(['GUEST', 'DAILY']).optional(),
        coinsReward: z.number().int().min(0).optional(),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const survey = await prisma.survey.update({
        where: { id },
        data: updateData,
      });

      return {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        type: survey.type,
        published: survey.published,
        isGuestSurvey: survey.isGuestSurvey,
        coinsReward: survey.coinsReward,
        order: survey.order,
        updatedAt: survey.updatedAt.toISOString(),
      };
    }),

  // Admin: Publish/Unpublish survey
  publish: publicProcedure
    .input(
      z.object({
        id: z.string(),
        published: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const survey = await prisma.survey.update({
        where: { id: input.id },
        data: { published: input.published },
      });

      return {
        id: survey.id,
        published: survey.published,
      };
    }),

  // Admin: Set as guest survey (only one can be guest survey)
  setGuestSurvey: publicProcedure
    .input(
      z.object({
        id: z.string(),
        isGuestSurvey: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      // If setting as guest survey, unset all others
      if (input.isGuestSurvey) {
        await prisma.survey.updateMany({
          where: {
            isGuestSurvey: true,
            id: { not: input.id },
          },
          data: { isGuestSurvey: false },
        });
      }

      const survey = await prisma.survey.update({
        where: { id: input.id },
        data: { isGuestSurvey: input.isGuestSurvey },
      });

      return {
        id: survey.id,
        isGuestSurvey: survey.isGuestSurvey,
      };
    }),

  // Admin: Delete survey
  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await prisma.survey.delete({
      where: { id: input.id },
    });

    return { success: true };
  }),

  // Admin: Create question
  createQuestion: publicProcedure
    .input(
      z.object({
        surveyId: z.string(),
        text: z.string().min(1),
        type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'RATING']),
        coinsReward: z.number().int().min(0).default(0),
        explanation: z.string().optional(),
        order: z.number().int().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const question = await prisma.question.create({
        data: input,
      });

      return {
        id: question.id,
        text: question.text,
        type: question.type,
        coinsReward: question.coinsReward,
        explanation: question.explanation,
        order: question.order,
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString(),
      };
    }),

  // Admin: Update question
  updateQuestion: publicProcedure
    .input(
      z.object({
        id: z.string(),
        text: z.string().min(1).optional(),
        type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'RATING']).optional(),
        coinsReward: z.number().int().min(0).optional(),
        explanation: z.string().optional().nullable(),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const question = await prisma.question.update({
        where: { id },
        data: updateData,
      });

      return {
        id: question.id,
        text: question.text,
        type: question.type,
        coinsReward: question.coinsReward,
        explanation: question.explanation,
        order: question.order,
        updatedAt: question.updatedAt.toISOString(),
      };
    }),

  // Admin: Delete question
  deleteQuestion: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.question.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Admin: Create option
  createOption: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        text: z.string().min(1),
        emoji: z.string().optional(),
        isCorrect: z.boolean().default(false),
        order: z.number().int().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const option = await prisma.option.create({
        data: input,
      });

      return {
        id: option.id,
        text: option.text,
        emoji: option.emoji,
        isCorrect: option.isCorrect,
        order: option.order,
        createdAt: option.createdAt.toISOString(),
        updatedAt: option.updatedAt.toISOString(),
      };
    }),

  // Admin: Update option
  updateOption: publicProcedure
    .input(
      z.object({
        id: z.string(),
        text: z.string().min(1).optional(),
        emoji: z.string().optional().nullable(),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const option = await prisma.option.update({
        where: { id },
        data: updateData,
      });

      return {
        id: option.id,
        text: option.text,
        emoji: option.emoji,
        order: option.order,
        updatedAt: option.updatedAt.toISOString(),
      };
    }),

  // Admin: Delete option
  deleteOption: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.option.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Mobile: Get guest survey (public)
  getGuestSurvey: publicProcedure.query(async () => {
    // Debug: Log all surveys to see what exists
    const allSurveys = await prisma.survey.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        published: true,
        isGuestSurvey: true,
        _count: {
          select: { questions: true },
        },
      },
    });
    console.log('[getGuestSurvey] All surveys:', JSON.stringify(allSurveys, null, 2));

    // Debug: Check for GUEST type surveys
    const guestTypeSurveys = await prisma.survey.findMany({
      where: { type: 'GUEST' },
      select: {
        id: true,
        title: true,
        type: true,
        published: true,
        isGuestSurvey: true,
      },
    });
    console.log('[getGuestSurvey] GUEST type surveys:', JSON.stringify(guestTypeSurveys, null, 2));

    const survey = await prisma.survey.findFirst({
      where: {
        type: 'GUEST',
        isGuestSurvey: true,
        published: true,
      },
      include: {
        questions: {
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    console.log('[getGuestSurvey] Found survey:', survey ? { id: survey.id, title: survey.title, questionsCount: survey.questions.length } : 'null');

    if (!survey) {
      // Fallback: Try to find any published GUEST survey (even if isGuestSurvey is false)
      console.log('[getGuestSurvey] No perfect match found, trying fallback: any published GUEST survey');
      const fallbackSurvey = await prisma.survey.findFirst({
        where: {
          type: 'GUEST',
          published: true,
        },
        include: {
          questions: {
            include: {
              options: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (fallbackSurvey) {
        console.log('[getGuestSurvey] Using fallback survey:', { id: fallbackSurvey.id, title: fallbackSurvey.title, isGuestSurvey: fallbackSurvey.isGuestSurvey });
        // Use fallback survey
        const surveyToReturn = fallbackSurvey;

        return {
          id: surveyToReturn.id,
          title: surveyToReturn.title,
          description: surveyToReturn.description,
          coinsReward: surveyToReturn.coinsReward,
          questions: surveyToReturn.questions.map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            coinsReward: q.coinsReward,
            options: q.options.map((o) => ({
              id: o.id,
              text: o.text,
              emoji: o.emoji,
            })),
          })),
        };
      }

      // More helpful error message
      const guestSurveys = await prisma.survey.findMany({
        where: { type: 'GUEST' },
        select: {
          id: true,
          title: true,
          published: true,
          isGuestSurvey: true,
        },
      });
      console.error('[getGuestSurvey] No matching survey found. Available GUEST surveys:', JSON.stringify(guestSurveys, null, 2));
      throw new Error('No guest survey available. Make sure a survey with type=GUEST is published. You can set it as guest survey in the admin panel.');
    }

    // Return survey data (no isCorrect needed - all answers get coins)
    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      coinsReward: survey.coinsReward,
      questions: survey.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        coinsReward: q.coinsReward,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          emoji: o.emoji,
        })),
      })),
    };
  }),

  // Mobile: Get daily survey (protected - requires auth)
  getDailySurvey: publicProcedure.query(async () => {
    const survey = await prisma.survey.findFirst({
      where: {
        type: 'DAILY',
        published: true,
      },
      include: {
        questions: {
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    if (!survey) {
      throw new Error('No daily survey available');
    }

    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      coinsReward: survey.coinsReward,
      questions: survey.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        coinsReward: q.coinsReward,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          emoji: o.emoji,
        })),
      })),
    };
  }),

  // Mobile: Submit survey answers
  submitAnswers: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        surveyId: z.string(),
        answers: z.array(
          z.object({
            questionId: z.string(),
            answer: z.union([z.string(), z.array(z.string())]), // Single option ID or array of option IDs
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      // Get survey and questions
      const survey = await prisma.survey.findUnique({
        where: { id: input.surveyId },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!survey) {
        throw new Error('Survey not found');
      }

      if (!survey.published) {
        throw new Error('Survey is not published');
      }

      let totalCoinsEarned = 0;
      const userAnswers = [];

      // Process each answer
      for (const answerInput of input.answers) {
        const question = survey.questions.find((q) => q.id === answerInput.questionId);
        if (!question) continue;

        // Get selected option IDs
        const selectedOptionIds = Array.isArray(answerInput.answer)
          ? answerInput.answer
          : [answerInput.answer];

        // Award coins for participation (all answers get coins, no correct/incorrect logic)
        const coinsEarned = question.coinsReward || 0;
        totalCoinsEarned += coinsEarned;

        // Save answer
        const userAnswer = await prisma.userAnswer.create({
          data: {
            userId: input.userId,
            surveyId: input.surveyId,
            questionId: answerInput.questionId,
            answer: JSON.stringify(selectedOptionIds),
            isCorrect: false, // Not used, but required by schema
            coinsEarned,
          },
        });

        userAnswers.push(userAnswer);
      }

      // Award survey completion coins
      if (userAnswers.length === survey.questions.length) {
        // All questions answered - award survey completion bonus
        const completionBonus = survey.coinsReward;
        totalCoinsEarned += completionBonus;

        // Create point record for survey completion
        await prisma.userPoint.create({
          data: {
            userId: input.userId,
            amount: completionBonus,
            reason: `Survey completed: ${survey.title}`,
            surveyId: input.surveyId,
          },
        });
      }

      // Create point records for answers
      for (const answer of userAnswers) {
        if (answer.coinsEarned > 0) {
          await prisma.userPoint.create({
            data: {
              userId: input.userId,
              amount: answer.coinsEarned,
              reason: `Survey answer`,
              surveyId: input.surveyId,
            },
          });
        }
      }

      return {
        success: true,
        totalCoinsEarned,
      };
    }),

  // Mobile: Submit guest survey answers (creates temporary guest user)
  submitGuestAnswers: publicProcedure
    .input(
      z.object({
        surveyId: z.string(),
        answers: z.array(
          z.object({
            questionId: z.string(),
            answer: z.union([z.string(), z.array(z.string())]),
          })
        ),
        guestId: z.string().optional(), // Optional: if provided, use existing guest user
      })
    )
    .mutation(async ({ input }) => {
      // Get or create a guest user
      let guestUser;
      if (input.guestId) {
        guestUser = await prisma.user.findUnique({
          where: { id: input.guestId },
        });
        if (!guestUser || !guestUser.email?.startsWith('guest_')) {
          throw new Error('Invalid guest user');
        }
      } else {
        // Create a new guest user
        // Note: Using USER role since GUEST is not in UserRole enum
        // Guest users are identified by email pattern: guest_*@flick.guest
        const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@flick.guest`;
        guestUser = await prisma.user.create({
          data: {
            email: guestEmail,
            displayName: 'Guest User',
            roles: ['USER'], // Use USER role, identify guests by email pattern
          },
        });
      }

      // Get survey and questions
      const survey = await prisma.survey.findUnique({
        where: { id: input.surveyId },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!survey) {
        throw new Error('Survey not found');
      }

      if (!survey.published) {
        throw new Error('Survey is not published');
      }

      let totalCoinsEarned = 0;
      const userAnswers = [];

      // Process each answer
      for (const answerInput of input.answers) {
        const question = survey.questions.find((q) => q.id === answerInput.questionId);
        if (!question) continue;

        const selectedOptionIds = Array.isArray(answerInput.answer)
          ? answerInput.answer
          : [answerInput.answer];

        // Award coins for participation (all answers get coins, no correct/incorrect logic)
        const coinsEarned = question.coinsReward || 0;
        totalCoinsEarned += coinsEarned;

        // Save answer
        const userAnswer = await prisma.userAnswer.create({
          data: {
            userId: guestUser.id,
            surveyId: input.surveyId,
            questionId: answerInput.questionId,
            answer: JSON.stringify(selectedOptionIds),
            isCorrect: false, // Not used, but required by schema
            coinsEarned,
          },
        });

        userAnswers.push(userAnswer);
      }

      // Award survey completion coins
      if (userAnswers.length === survey.questions.length) {
        const completionBonus = survey.coinsReward || 0;
        totalCoinsEarned += completionBonus;

        await prisma.userPoint.create({
          data: {
            userId: guestUser.id,
            amount: completionBonus,
            reason: `Survey completed: ${survey.title}`,
            surveyId: input.surveyId,
          },
        });
      }

      // Create point records for answers
      for (const answer of userAnswers) {
        if (answer.coinsEarned > 0) {
          await prisma.userPoint.create({
            data: {
              userId: guestUser.id,
              amount: answer.coinsEarned,
              reason: `Survey answer`,
              surveyId: input.surveyId,
            },
          });
        }
      }

      return {
        success: true,
        totalCoinsEarned,
        guestUserId: guestUser.id, // Return guest user ID for future use
      };
    }),

  // Admin: Get all answers for a survey
  getSurveyAnswers: publicProcedure
    .input(z.object({ surveyId: z.string() }))
    .query(async ({ input }) => {
      const answers = await prisma.userAnswer.findMany({
        where: { surveyId: input.surveyId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              displayName: true,
              roles: true,
            },
          },
          question: {
            include: {
              options: {
                select: {
                  id: true,
                  text: true,
                  emoji: true,
                },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      // Group answers by user
      const answersByUser = new Map();
      for (const answer of answers) {
        const userId = answer.userId;
        if (!answersByUser.has(userId)) {
          answersByUser.set(userId, {
            user: answer.user,
            answers: [],
            totalCoins: 0,
            submittedAt: answer.submittedAt,
          });
        }
        const userAnswers = answersByUser.get(userId);
        userAnswers.answers.push({
          questionId: answer.questionId,
          questionText: answer.question.text,
          questionType: answer.question.type,
          questionOptions: answer.question.options || [],
          answer: JSON.parse(answer.answer),
          isCorrect: answer.isCorrect,
          coinsEarned: answer.coinsEarned,
          submittedAt: answer.submittedAt.toISOString(),
        });
        userAnswers.totalCoins += answer.coinsEarned;
        // Update submittedAt to the latest answer
        if (new Date(answer.submittedAt) > new Date(userAnswers.submittedAt)) {
          userAnswers.submittedAt = answer.submittedAt;
        }
      }

      return Array.from(answersByUser.values()).map((entry) => ({
        ...entry,
        submittedAt: entry.submittedAt.toISOString(),
      }));
    }),

  // Mobile: List all published surveys with user's answer status
  listSurveysForUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.userId;

    // Get all published surveys
    const surveys = await prisma.survey.findMany({
      where: {
        published: true,
        type: 'DAILY', // Only show daily surveys on home (guest surveys are separate)
      },
      include: {
        questions: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Get all surveys the user has answered
    const userAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: userId,
      },
      select: {
        surveyId: true,
      },
      distinct: ['surveyId'],
    });

    const answeredSurveyIds = new Set(userAnswers.map((a) => a.surveyId));

    return surveys.map((survey) => ({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      type: survey.type,
      coinsReward: survey.coinsReward,
      order: survey.order,
      questionCount: survey.questions.length,
      hasAnswered: answeredSurveyIds.has(survey.id),
      createdAt: survey.createdAt.toISOString(),
      updatedAt: survey.updatedAt.toISOString(),
    }));
  }),

  // Mobile: Get survey by ID for authenticated users
  getSurveyById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const survey = await prisma.survey.findUnique({
      where: { id: input.id },
      include: {
        questions: {
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    if (!survey.published) {
      throw new Error('Survey is not published');
    }

    // Check if user has already answered this survey
    const userAnswer = await prisma.userAnswer.findFirst({
      where: {
        userId: ctx.user.userId,
        surveyId: input.id,
      },
      select: {
        id: true,
      },
    });

    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      coinsReward: survey.coinsReward,
      hasAnswered: !!userAnswer,
      questions: survey.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        coinsReward: q.coinsReward,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          emoji: o.emoji,
        })),
      })),
    };
  }),

  // Mobile: Submit survey answers (protected - uses authenticated user)
  submitSurveyAnswers: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
        answers: z.array(
          z.object({
            questionId: z.string(),
            answer: z.union([z.string(), z.array(z.string())]), // Single option ID or array of option IDs
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.userId;

      // Get survey and questions
      const survey = await prisma.survey.findUnique({
        where: { id: input.surveyId },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!survey) {
        throw new Error('Survey not found');
      }

      if (!survey.published) {
        throw new Error('Survey is not published');
      }

      // Check if user has already answered this survey
      const existingAnswer = await prisma.userAnswer.findFirst({
        where: {
          userId: userId,
          surveyId: input.surveyId,
        },
      });

      if (existingAnswer) {
        throw new Error('You have already answered this survey');
      }

      let totalCoinsEarned = 0;
      const userAnswers = [];

      // Process each answer
      for (const answerInput of input.answers) {
        const question = survey.questions.find((q) => q.id === answerInput.questionId);
        if (!question) continue;

        // Get selected option IDs
        const selectedOptionIds = Array.isArray(answerInput.answer)
          ? answerInput.answer
          : [answerInput.answer];

        // Award coins for participation (all answers get coins, no correct/incorrect logic)
        const coinsEarned = question.coinsReward || 0;
        totalCoinsEarned += coinsEarned;

        // Save answer
        const userAnswer = await prisma.userAnswer.create({
          data: {
            userId: userId,
            surveyId: input.surveyId,
            questionId: answerInput.questionId,
            answer: JSON.stringify(selectedOptionIds),
            isCorrect: false, // Not used, but required by schema
            coinsEarned,
          },
        });

        userAnswers.push(userAnswer);
      }

      // Award survey completion coins
      if (userAnswers.length === survey.questions.length) {
        // All questions answered - award survey completion bonus
        const completionBonus = survey.coinsReward;
        totalCoinsEarned += completionBonus;

        // Create point record for survey completion
        await prisma.userPoint.create({
          data: {
            userId: userId,
            amount: completionBonus,
            reason: `Survey completed: ${survey.title}`,
            surveyId: input.surveyId,
          },
        });
      }

      // Create point records for answers
      for (const answer of userAnswers) {
        if (answer.coinsEarned > 0) {
          await prisma.userPoint.create({
            data: {
              userId: userId,
              amount: answer.coinsEarned,
              reason: `Survey answer`,
              surveyId: input.surveyId,
            },
          });
        }
      }

      return {
        success: true,
        totalCoinsEarned,
      };
    }),
});

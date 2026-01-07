import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/tokens';
import { ScreenContainer, Button, ProgressBar, CoinPill, Card, AnimatedOption } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';
import {
  setGuestSurveyCompleted,
  setGuestCoinsEarned,
  setGuestSurveyId,
  setGuestAnswers,
  setGuestUserId,
} from '@/lib/guest';

export default function GuestSurveyPage() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const questionFade = useRef(new Animated.Value(0)).current;
  const questionSlide = useRef(new Animated.Value(30)).current;

  const { data: survey, isLoading, error, refetch, isRefetching } = api.survey.getGuestSurvey.useQuery();

  // Note: Coins are now awarded for participation, not for correct answers
  const submitGuestAnswersMutation = api.survey.submitGuestAnswers.useMutation({
    onSuccess: async (data) => {
      // Store guest survey completion, coins, survey ID, answers, and guest user ID locally
      await setGuestSurveyCompleted();
      await setGuestCoinsEarned(data.totalCoinsEarned);
      await setGuestSurveyId(survey!.id);
      await setGuestAnswers(answers);
      if (data.guestUserId) {
        await setGuestUserId(data.guestUserId);
      }
      
      // Navigate to signup wall immediately - confetti will show there
      triggerHaptic('success').catch(() => {});
      router.replace('/auth/signup-wall');
    },
    onError: (error) => {
      console.error('Error submitting guest answers:', error);
      alert('Failed to submit survey. Please try again.');
    },
  });

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    triggerHaptic('light').catch(() => {});
    setAnswers({ ...answers, [questionId]: answer });
  };

  useEffect(() => {
    // Animate question entrance
    questionFade.setValue(0);
    questionSlide.setValue(30);
    Animated.parallel([
      Animated.timing(questionFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(questionSlide, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestionIndex]);

  const handleNext = () => {
    triggerHaptic('success').catch(() => {});
    if (currentQuestionIndex < (survey?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!survey) return;

    // Convert answers to API format
    const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer: Array.isArray(answer) ? answer : answer,
    }));

    // Submit to backend API (creates guest user and saves answers)
    submitGuestAnswersMutation.mutate({
      surveyId: survey.id,
      answers: answerArray,
    });
  };

  // Check if error is specifically about no guest survey being available
  const getErrorMessage = (err: any): string => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    if (err.data?.message) return err.data.message;
    if (err.shape?.message) return err.shape.message;
    return '';
  };

  const errorMessage = getErrorMessage(error);
  const isNoGuestSurveyError = error && errorMessage.includes('No guest survey available');

  // Show loading screen when:
  // 1. Query is loading
  // 2. Survey is undefined and we don't have an error yet (initial load)
  // 3. Submitting answers
  if (isLoading || (!survey && !error) || submitGuestAnswersMutation.isPending) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.flickTeal} />
          {submitGuestAnswersMutation.isPending ? (
            <Text style={styles.loadingText}>Submitting your answers...</Text>
          ) : (
            <Text style={styles.loadingText}>Loading survey...</Text>
          )}
        </View>
      </ScreenContainer>
    );
  }

  if (isNoGuestSurveyError || (!isLoading && !survey && error)) {
    return (
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={styles.noSurveyContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.flickTeal}
              colors={[colors.flickTeal]}
            />
          }
        >
          <Text style={styles.noSurveyEmoji}>📝</Text>
          <Text style={styles.noSurveyTitle}>No Guest Survey Available</Text>
          <Text style={styles.noSurveyText}>
            There are no guest surveys available at the moment. Sign up or log in to start answering surveys and earning coins!
          </Text>

          <View style={styles.authButtonsContainer}>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push('/auth/signup')}
            >
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (error && !isNoGuestSurveyError) {
    return (
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={styles.noSurveyContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.flickTeal}
              colors={[colors.flickTeal]}
            />
          }
        >
          <Text style={styles.errorText}>An error occurred. Please try again.</Text>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={styles.signUpButtonText}>Continue to Sign Up</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }


  const currentQuestion = survey.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const selectedAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;
  const isRatingQuestion = currentQuestion.type === 'RATING';
  
  // Check if rating uses numbers (1,2,3...) - emojis are handled separately in AnimatedOption
  // Rating questions can have: numbers only, emojis only, or emoji + number combinations
  const firstOptionText = currentQuestion.options[0]?.text || '';
  const isRatingNumber = /^\d+$/.test(firstOptionText);

  return (
    <ScreenContainer style={styles.screenContainer}>
      <View style={styles.contentContainer}>
        {/* Top Progress Section - Fixed at top */}
        <View style={styles.topSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {survey.questions.length}
            </Text>
            {currentQuestion.coinsReward > 0 && (
              <CoinPill amount={currentQuestion.coinsReward} size="small" animated />
            )}
          </View>
          <ProgressBar progress={progress} height={12} color={colors.flickGold} />
        </View>

        {/* Scrollable content area */}
        <View style={styles.scrollableContent}>
          {/* Question Card */}
          <Animated.View
            style={[
              styles.questionCard,
              {
                opacity: questionFade,
                transform: [{ translateY: questionSlide }],
              },
            ]}
          >
            <View style={styles.questionEmojiContainer}>
              <Text style={styles.questionEmoji}>🤔</Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion.text}</Text>
            {currentQuestion.type === 'MULTIPLE_CHOICE' && (
              <Text style={styles.questionHint}>Select all that apply</Text>
            )}
          </Animated.View>

          {/* Options */}
          <Animated.View
            style={[
              isRatingQuestion ? styles.optionsContainerRating : styles.optionsContainer,
              {
                opacity: questionFade,
              },
            ]}
          >
            {currentQuestion.options.map((option, index) => {
              const isSelected =
                currentQuestion.type === 'SINGLE_CHOICE' || 
                currentQuestion.type === 'TRUE_FALSE' ||
                currentQuestion.type === 'RATING'
                  ? selectedAnswer === option.id
                  : Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id);

              return (
                <AnimatedOption
                  key={option.id}
                  text={option.text}
                  emoji={option.emoji || undefined}
                  isSelected={isSelected}
                  delay={index * 70}
                  variant={isRatingQuestion ? 'rating' : 'default'}
                  isRatingNumber={isRatingNumber}
                  onPress={() => {
                    if (
                      currentQuestion.type === 'SINGLE_CHOICE' || 
                      currentQuestion.type === 'TRUE_FALSE' ||
                      currentQuestion.type === 'RATING'
                    ) {
                      handleAnswer(currentQuestion.id, option.id);
                    } else if (currentQuestion.type === 'MULTIPLE_CHOICE') {
                      const currentAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : [];
                      if (currentAnswers.includes(option.id)) {
                        handleAnswer(
                          currentQuestion.id,
                          currentAnswers.filter((id: string) => id !== option.id)
                        );
                      } else {
                        handleAnswer(currentQuestion.id, [...currentAnswers, option.id]);
                      }
                    }
                  }}
                />
              );
            })}
          </Animated.View>

          {/* Motivational Text - only show if not last question to avoid overlap */}
          {selectedAnswer && currentQuestionIndex < survey.questions.length - 1 && (
            <Animated.View style={styles.motivationalContainer}>
              <Text style={styles.motivationalText}>Great choice! 👍</Text>
            </Animated.View>
          )}
        </View>

        {/* Next Button - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <Button
            title={currentQuestionIndex === survey.questions.length - 1 ? 'Finish & Claim Coins 🎉' : 'Continue'}
            onPress={handleNext}
            disabled={
              !selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)
            }
            variant="secondary"
            style={styles.nextButton}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    ...typography.body,
    fontSize: 17,
    color: colors.gray[600],
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  scrollableContent: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.gray[50],
  },
  topSection: {
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    letterSpacing: -0.3,
  },
  questionCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: colors.flickTeal,
    borderBottomWidth: 6,
    borderBottomColor: colors.flickTealDark,
    ...shadows.lg,
  },
  questionEmojiContainer: {
    alignSelf: 'center',
    backgroundColor: colors.flickTealLight,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: colors.flickTeal,
  },
  questionEmoji: {
    fontSize: 36,
    textAlign: 'center',
  },
  questionText: {
    ...typography.title,
    fontSize: 26,
    color: colors.gray[900],
    textAlign: 'center',
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  questionHint: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  optionsContainer: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionsContainerRating: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  motivationalContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  motivationalText: {
    ...typography.body,
    fontSize: 17,
    color: colors.success,
    fontWeight: '700',
    textAlign: 'center',
  },
  nextButton: {
    width: '100%',
  },
  errorText: {
    ...typography.body,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  redirectText: {
    ...typography.caption,
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  noSurveyContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSurveyEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  noSurveyTitle: {
    ...typography.largeTitle,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  noSurveyText: {
    ...typography.body,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    lineHeight: 24,
  },
  authButtonsContainer: {
    width: '100%',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  signUpButton: {
    backgroundColor: colors.flickTeal,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: colors.flickTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.flickTeal,
  },
  loginButtonText: {
    ...typography.body,
    color: colors.flickTeal,
    fontWeight: '600',
  },
});


import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/tokens';
import { ScreenContainer, Button, ProgressBar, CoinPill, Confetti, AnimatedOption } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';

export default function SurveyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const questionFade = useRef(new Animated.Value(0)).current;
  const questionSlide = useRef(new Animated.Value(30)).current;

  const { data: survey, isLoading, error } = api.survey.getSurveyById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const submitMutation = api.survey.submitSurveyAnswers.useMutation({
    onSuccess: (data) => {
      setCoinsEarned(data.totalCoinsEarned);
      setShowResult(true);
      setShowConfetti(true);
      triggerHaptic('success').catch(() => {});

      // Auto-redirect to home after 4 seconds
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 4000);
    },
    onError: (err) => {
      Alert.alert('Oops!', err.message || 'Failed to submit answers. Please try again.');
      triggerHaptic('error').catch(() => {});
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
    if (!survey) return;

    const currentQuestion = survey.questions[currentQuestionIndex];
    const selectedAnswer = answers[currentQuestion.id];

    if (!selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)) {
      triggerHaptic('warning').catch(() => {});
      Alert.alert('Hold on!', 'Please select an answer before proceeding.');
      return;
    }

    triggerHaptic('success').catch(() => {});

    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    triggerHaptic('light').catch(() => {});

    // If on first question, show exit confirmation
    if (currentQuestionIndex === 0) {
      Alert.alert(
        'Exit Survey?',
        'Are you sure you want to leave? Your progress will be lost.',
        [
          {
            text: 'Keep Going',
            style: 'cancel',
            onPress: () => {
              triggerHaptic('light').catch(() => {});
            },
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              triggerHaptic('warning').catch(() => {});
              router.back();
            },
          },
        ]
      );
    } else {
      // Go to previous question
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (!survey) return;

    const mappedAnswers = Object.entries(answers).map(([questionId, answer]) => {
      return { questionId, answer };
    });

    submitMutation.mutate({
      surveyId: survey.id,
      answers: mappedAnswers,
    });
  };

  // Loading state
  if (isLoading || (!survey && !error) || submitMutation.isPending) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>✨</Text>
          <ActivityIndicator size="large" color={colors.flickTeal} />
          {submitMutation.isPending ? (
            <Text style={styles.loadingText}>Saving your answers...</Text>
          ) : (
            <Text style={styles.loadingText}>Loading survey...</Text>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // Error state
  if (error || !survey) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Oops, something went wrong!</Text>
          <Text style={styles.errorText}>
            {error?.message || 'We could not find this survey. Please try again later.'}
          </Text>
          <Button 
            title="Go Back" 
            onPress={() => router.replace('/(tabs)')} 
            variant="primary" 
            style={styles.errorButton}
          />
        </View>
      </ScreenContainer>
    );
  }

  // Already answered state
  if (survey.hasAnswered) {
    return (
      <ScreenContainer>
        <View style={styles.answeredContainer}>
          <Text style={styles.answeredEmoji}>✅</Text>
          <Text style={styles.answeredTitle}>You've already completed this survey!</Text>
          <Text style={styles.answeredText}>
            Great job! Check out other surveys or view your progress.
          </Text>
          <Button 
            title="Go to Home" 
            onPress={() => router.replace('/(tabs)')} 
            variant="primary"
            icon="🏠"
            style={styles.answeredButton}
          />
        </View>
      </ScreenContainer>
    );
  }

  // Success/Result state
  if (showResult) {
    return (
      <ScreenContainer style={styles.successScreenContainer}>
        {showConfetti && <Confetti count={80} duration={4000} />}
        <View style={styles.successContainer}>
          {/* Top celebration section */}
          <View style={styles.successHeader}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>Survey Complete!</Text>
            <Text style={styles.celebrationSubtitle}>You're making Lebanon's voice heard!</Text>
          </View>
          
          {/* Coins earned - hero section */}
          <View style={styles.coinsHeroCard}>
            <Text style={styles.coinsHeroLabel}>You earned</Text>
            <View style={styles.coinPillWrapper}>
              <View style={styles.coinPillCenter}>
                <CoinPill amount={coinsEarned} size="large" animated />
              </View>
            </View>
            <Text style={styles.coinsHeroSubtext}>Added to your wallet</Text>
          </View>

          {/* Stats in compact row */}
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeEmoji}>✅</Text>
              <Text style={styles.statBadgeValue}>{survey.questions.length}</Text>
              <Text style={styles.statBadgeLabel}>Questions</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeEmoji}>⚡</Text>
              <Text style={styles.statBadgeValue}>+1</Text>
              <Text style={styles.statBadgeLabel}>Streak</Text>
            </View>
          </View>

          {/* You vs Lebanon insight card */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>🇱🇧</Text>
              <Text style={styles.insightTitle}>You vs Lebanon</Text>
            </View>
            <Text style={styles.insightText}>
              You're among the <Text style={styles.insightHighlight}>top contributors</Text> helping shape Lebanon's future through your voice!
            </Text>
          </View>

          {/* CTA Button */}
          <Button
            title="Back to Home"
            onPress={() => router.replace('/(tabs)')}
            variant="secondary"
            style={styles.successButton}
          />

          <Text style={styles.redirectText}>Auto-redirecting in a moment...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Main survey UI
  const currentQuestion = survey.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const selectedAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;
  const isRatingQuestion = currentQuestion.type === 'RATING';
  const isTrueFalseQuestion = currentQuestion.type === 'TRUE_FALSE';
  
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
          <ProgressBar 
            progress={progress} 
            current={currentQuestionIndex + 1}
            total={survey.questions.length}
            showText={false}
          />
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
              (isRatingQuestion || isTrueFalseQuestion) ? styles.optionsContainerRating : styles.optionsContainer,
              {
                opacity: questionFade,
              },
            ]}
          >
            {currentQuestion.options.map((option, index) => {
              const isSelected =
                currentQuestion.type === 'SINGLE_CHOICE' || 
                currentQuestion.type === 'RATING' ||
                currentQuestion.type === 'TRUE_FALSE'
                  ? selectedAnswer === option.id
                  : Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id);

              return (
                <AnimatedOption
                  key={option.id}
                  emoji={option.emoji || undefined}
                  text={option.text}
                  isSelected={isSelected}
                  delay={index * 70}
                  variant={isRatingQuestion ? 'rating' : isTrueFalseQuestion ? 'trueFalse' : 'default'}
                  isRatingNumber={isRatingNumber}
                  onPress={() => {
                    if (
                      currentQuestion.type === 'SINGLE_CHOICE' ||
                      currentQuestion.type === 'RATING' ||
                      currentQuestion.type === 'TRUE_FALSE'
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

          {/* Motivational Text */}
          {selectedAnswer && !isLastQuestion && (
            <Animated.View style={styles.motivationalContainer}>
              <Text style={styles.motivationalText}>Great choice! Keep going! 💪</Text>
            </Animated.View>
          )}
        </View>

        {/* Navigation Buttons - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <View style={styles.navigationButtons}>
            <Button
              title="Back"
              onPress={handleBack}
              variant="primary"
              style={styles.backButton}
            />
            <Button
              title={isLastQuestion ? 'Finish & Claim Coins 🎉' : 'Continue'}
              onPress={handleNext}
              disabled={
                !selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)
              }
              variant="secondary"
              style={styles.nextButton}
            />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    backgroundColor: colors.gray[50],
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
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.gray[50],
  },
  loadingEmoji: {
    fontSize: 64,
    textAlign: 'center',
  },
  loadingText: {
    ...typography.body,
    fontSize: 17,
    color: colors.gray[700],
    fontWeight: '600',
  },
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    ...typography.largeTitle,
    fontSize: 28,
    color: colors.gray[900],
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  errorButton: {
    marginBottom: spacing.sm,
  },
  // Already Answered State
  answeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  answeredEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  answeredTitle: {
    ...typography.largeTitle,
    fontSize: 28,
    color: colors.flickTeal,
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  answeredText: {
    ...typography.body,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  answeredButton: {
    marginBottom: spacing.sm,
  },
  // Success State
  successScreenContainer: {
    backgroundColor: colors.white,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xl,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  celebrationEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  celebrationTitle: {
    ...typography.largeTitle,
    fontSize: 34,
    color: colors.gray[900],
    textAlign: 'center',
    fontWeight: '900',
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  celebrationSubtitle: {
    ...typography.body,
    fontSize: 17,
    color: colors.gray[600],
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  coinsHeroCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.flickGoldLight,
    borderRadius: borderRadius.xl,
    borderWidth: 3,
    borderColor: colors.flickGold,
    borderBottomWidth: 6,
    borderBottomColor: colors.flickGoldDark,
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  coinPillWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinPillCenter: {
    alignSelf: 'center',
  },
  coinsHeroLabel: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[700],
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  coinsHeroSubtext: {
    ...typography.caption,
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
    marginTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBadge: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  statBadgeEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statBadgeValue: {
    ...typography.title,
    fontSize: 22,
    color: colors.gray[900],
    fontWeight: '800',
    marginBottom: 2,
  },
  statBadgeLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.gray[600],
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: colors.flickTealLight,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 3,
    borderColor: colors.flickTeal,
    marginBottom: spacing.xl,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  insightIcon: {
    fontSize: 24,
  },
  insightTitle: {
    ...typography.body,
    fontSize: 16,
    color: colors.flickTealDark,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  insightText: {
    ...typography.body,
    fontSize: 15,
    color: colors.flickTealDark,
    lineHeight: 22,
    fontWeight: '500',
  },
  insightHighlight: {
    fontWeight: '800',
    color: colors.flickTeal,
  },
  successButton: {
    marginBottom: spacing.sm,
    minHeight: 56,
  },
  redirectText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
    fontWeight: '500',
  },
  // Main Survey UI
  topSection: {
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});


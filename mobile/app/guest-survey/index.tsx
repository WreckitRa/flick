import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';
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
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const coinAnimation = new Animated.Value(1);

  const { data: survey, isLoading, error } = api.survey.getGuestSurvey.useQuery();

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
      setCoinsEarned(data.totalCoinsEarned);
      setShowResult(true);

      // Animate coin celebration
      Animated.sequence([
        Animated.timing(coinAnimation, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(coinAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    },
    onError: (error) => {
      console.error('Error submitting guest answers:', error);
      alert('Failed to submit survey. Please try again.');
    },
  });

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
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

  if (isLoading || submitGuestAnswersMutation.isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.flickBlue} />
        {submitGuestAnswersMutation.isPending && (
          <Text style={styles.loadingText}>Submitting your answers...</Text>
        )}
      </View>
    );
  }

  if (error || !survey) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No survey available at the moment</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/auth/signup')}
        >
          <Text style={styles.buttonText}>Continue to Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showResult) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ transform: [{ scale: coinAnimation }] }}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
          </Animated.View>
          <Text style={styles.celebrationTitle}>Great job!</Text>
          
          {/* Coins Earned (Pending) */}
          <View style={styles.coinsContainer}>
            <Text style={styles.coinsLabel}>You earned</Text>
            <Text style={styles.coinsText}>
              <Text style={styles.coinsHighlight}>🪙 {coinsEarned} Flick Coins</Text>
            </Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          </View>

          {/* Insight Card */}
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>📊 You vs Lebanon</Text>
            <Text style={styles.insightText}>
              Your answer will be compared with the Lebanese community. See how your preferences match up!
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.replace('/auth/signup-wall')}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const currentQuestion = survey.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const selectedAnswer = answers[currentQuestion.id];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1} of {survey.questions.length}
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
          {currentQuestion.coinsReward > 0 && (
            <View style={styles.coinsBadge}>
              <Text style={styles.coinsBadgeText}>🪙 +{currentQuestion.coinsReward} coins</Text>
            </View>
          )}
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => {
            const isSelected =
              currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE'
                ? selectedAnswer === option.id
                : Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id);

            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => {
                  if (currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE') {
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
              >
                <Text style={styles.optionEmoji}>{option.emoji || '○'}</Text>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.text}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!selectedAnswer ||
              (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)) &&
              styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={
            !selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)
          }
        >
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex === survey.questions.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.flickBlue,
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.caption,
    color: colors.gray[600],
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  questionText: {
    ...typography.title,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  coinsBadge: {
    backgroundColor: colors.flickYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  coinsBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.gray[900],
  },
  optionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: colors.flickBlue,
    borderColor: colors.flickBlue,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  optionText: {
    ...typography.body,
    flex: 1,
    color: colors.gray[900],
  },
  optionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: colors.flickBlue,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  celebrationEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  celebrationTitle: {
    ...typography.largeTitle,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  coinsContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  coinsLabel: {
    ...typography.body,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  coinsText: {
    ...typography.largeTitle,
    color: colors.flickBlue,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  coinsHighlight: {
    color: colors.flickBlue,
  },
  pendingBadge: {
    backgroundColor: colors.flickYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  pendingText: {
    ...typography.caption,
    color: colors.black,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: colors.flickBlueLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.flickBlue,
  },
  insightTitle: {
    ...typography.title,
    color: colors.flickBlue,
    marginBottom: spacing.sm,
  },
  insightText: {
    ...typography.body,
    color: colors.gray[700],
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: colors.flickYellow,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.flickYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
  },
  errorText: {
    ...typography.body,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.flickBlue,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  redirectText: {
    ...typography.caption,
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});


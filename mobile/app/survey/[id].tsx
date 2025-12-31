import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

export default function SurveyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const coinAnimation = new Animated.Value(1);

  const { data: survey, isLoading, error } = api.survey.getSurveyById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const submitMutation = api.survey.submitSurveyAnswers.useMutation({
    onSuccess: (data) => {
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

      // Auto-redirect to home after 3 seconds
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 3000);
    },
    onError: (err) => {
      Alert.alert('Error', err.message || 'Failed to submit answers. Please try again.');
    },
  });

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (!survey) return;

    const currentQuestion = survey.questions[currentQuestionIndex];
    const selectedAnswer = answers[currentQuestion.id];

    if (!selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)) {
      Alert.alert('Hold on!', 'Please select an answer before proceeding.');
      return;
    }

    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!survey) return;

    // Map TRUE_FALSE answers from 'true'/'false' strings to actual option IDs
    const mappedAnswers = Object.entries(answers).map(([questionId, answer]) => {
      const question = survey.questions.find((q) => q.id === questionId);
      
      // For TRUE_FALSE questions, map 'true'/'false' to actual option IDs
      if (question?.type === 'TRUE_FALSE' && typeof answer === 'string') {
        // Find the option that matches True or False
        const trueOption = question.options.find((opt) => 
          opt.text.toLowerCase().includes('true') || opt.id === 'true'
        );
        const falseOption = question.options.find((opt) => 
          opt.text.toLowerCase().includes('false') || opt.id === 'false'
        );
        
        if (answer === 'true' && trueOption) {
          return { questionId, answer: trueOption.id };
        } else if (answer === 'false' && falseOption) {
          return { questionId, answer: falseOption.id };
        }
        // Fallback: use first option for true, second for false
        if (answer === 'true' && question.options[0]) {
          return { questionId, answer: question.options[0].id };
        } else if (answer === 'false' && question.options[1]) {
          return { questionId, answer: question.options[1].id };
        }
      }
      
      return { questionId, answer };
    });

    submitMutation.mutate({
      surveyId: survey.id,
      answers: mappedAnswers,
    });
  };

  if (isLoading || submitMutation.isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.flickBlue} />
        {submitMutation.isPending && (
          <Text style={styles.loadingText}>Submitting your answers...</Text>
        )}
      </View>
    );
  }

  if (error || !survey) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {error?.message || 'Survey not found'}
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (survey.hasAnswered) {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>✅</Text>
        <Text style={styles.title}>You've already completed this survey!</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
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
          <Text style={styles.coinsText}>
            You earned <Text style={styles.coinsHighlight}>🪙 {coinsEarned} Flick Coins</Text>
          </Text>
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>
              You answered {survey.questions.length} questions and earned {coinsEarned} coins!
            </Text>
          </View>
          <Text style={styles.redirectText}>Taking you back to surveys...</Text>
        </ScrollView>
      </View>
    );
  }

  const currentQuestion = survey.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const selectedAnswer = answers[currentQuestion.id];

  const handleExit = () => {
    const hasAnswers = Object.keys(answers).length > 0;
    
    if (hasAnswers) {
      Alert.alert(
        'Exit Survey?',
        'You have started answering this survey. Are you sure you want to exit? Your progress will not be saved.',
        [
          {
            text: 'Continue Survey',
            style: 'cancel',
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Exit Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <Text style={styles.exitButtonText}>← Exit</Text>
        </TouchableOpacity>
      </View>

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

        {/* Survey Title */}
        <View style={styles.surveyHeader}>
          <Text style={styles.surveyTitle}>{survey.title}</Text>
          {survey.description && (
            <Text style={styles.surveyDescription}>{survey.description}</Text>
          )}
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
          {currentQuestion.coinsReward > 0 && (
            <View style={styles.coinsBadge}>
              <Text style={styles.coinsBadgeText}>🪙 +{currentQuestion.coinsReward}</Text>
            </View>
          )}
        </View>

        {/* Options */}
        {currentQuestion.type === 'TRUE_FALSE' ? (
          <View style={styles.optionsContainerTrueFalse}>
            {[
              { id: 'true', text: 'True', emoji: '✅' },
              { id: 'false', text: 'False', emoji: '❌' },
            ].map((option) => {
              const isSelected = selectedAnswer === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    styles.optionButtonTrueFalse,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => {
                    handleAnswer(currentQuestion.id, option.id);
                  }}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.text}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const isSelected =
                currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'RATING'
                  ? selectedAnswer === option.id
                  : Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id);

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => {
                    if (
                      currentQuestion.type === 'SINGLE_CHOICE' ||
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
        )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  exitButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  exitButtonText: {
    ...typography.body,
    color: colors.flickBlue,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.gray[600],
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.largeTitle,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.flickBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  buttonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
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
  surveyHeader: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  surveyTitle: {
    ...typography.title,
    color: colors.flickBlue,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  surveyDescription: {
    ...typography.body,
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
    marginBottom: spacing.sm,
  },
  coinsBadge: {
    backgroundColor: colors.flickYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  coinsBadgeText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.black,
  },
  optionsContainer: {
    flex: 1,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  optionsContainerTrueFalse: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionButtonTrueFalse: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 80,
  },
  optionButtonSelected: {
    borderColor: colors.flickBlue,
    backgroundColor: colors.flickBlue,
  },
  optionEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  optionText: {
    ...typography.body,
    flex: 1,
    color: colors.gray[900],
  },
  optionTextSelected: {
    fontWeight: 'bold',
    color: colors.white,
  },
  checkmark: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  nextButton: {
    backgroundColor: colors.flickYellow,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.flickYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray[300],
    shadowColor: 'transparent',
    elevation: 0,
  },
  nextButtonText: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
  },
  celebrationEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  celebrationTitle: {
    ...typography.largeTitle,
    color: colors.flickBlue,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  coinsText: {
    ...typography.subtitle,
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  coinsHighlight: {
    color: colors.flickYellow,
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  resultText: {
    ...typography.body,
    color: colors.gray[800],
    textAlign: 'center',
  },
  redirectText: {
    ...typography.caption,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});


import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { data: surveys, isLoading, refetch, isRefetching } = api.survey.listSurveysForUser.useQuery();

  const handleSurveyPress = (surveyId: string, hasAnswered: boolean) => {
    if (hasAnswered) {
      // TODO: Navigate to survey results/history
      // For now, just show a message
      return;
    }
    // Navigate to survey taking screen
    router.push(`/survey/${surveyId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.flickBlue} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.flickBlue} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Surveys</Text>
        <Text style={styles.subtitle}>Earn coins by sharing your opinions</Text>
      </View>

      {!surveys || surveys.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyText}>No surveys available at the moment</Text>
          <Text style={styles.emptySubtext}>Check back later for new surveys!</Text>
        </View>
      ) : (
        <View style={styles.surveysList}>
          {surveys.map((survey) => (
            <TouchableOpacity
              key={survey.id}
              style={[styles.surveyCard, survey.hasAnswered && styles.surveyCardAnswered]}
              onPress={() => handleSurveyPress(survey.id, survey.hasAnswered)}
            >
              <View style={styles.surveyHeader}>
                <View style={styles.surveyTitleContainer}>
                  <Text style={styles.surveyTitle}>{survey.title}</Text>
                  {survey.hasAnswered && (
                    <View style={styles.answeredBadge}>
                      <Text style={styles.answeredBadgeText}>✓ Answered</Text>
                    </View>
                  )}
                </View>
                <View style={styles.coinsBadge}>
                  <Text style={styles.coinsText}>🪙 {survey.coinsReward}</Text>
                </View>
              </View>

              {survey.description && (
                <Text style={styles.surveyDescription} numberOfLines={2}>
                  {survey.description}
                </Text>
              )}

              <View style={styles.surveyFooter}>
                <Text style={styles.questionCount}>
                  {survey.questionCount} {survey.questionCount === 1 ? 'question' : 'questions'}
                </Text>
                {survey.hasAnswered ? (
                  <Text style={styles.statusText}>Completed</Text>
                ) : (
                  <Text style={styles.statusTextNew}>New</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.flickBlue,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.gray[600],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.title,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.gray[500],
  },
  surveysList: {
    gap: spacing.md,
  },
  surveyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.flickBlue,
    shadowColor: colors.flickBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  surveyCardAnswered: {
    borderColor: colors.gray[300],
    backgroundColor: colors.gray[50],
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  surveyTitleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  surveyTitle: {
    ...typography.title,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  answeredBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  answeredBadgeText: {
    ...typography.caption,
    color: colors.gray[700],
    fontWeight: '600',
  },
  coinsBadge: {
    backgroundColor: colors.flickYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  coinsText: {
    ...typography.body,
    color: colors.black,
    fontWeight: 'bold',
  },
  surveyDescription: {
    ...typography.body,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  surveyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  questionCount: {
    ...typography.caption,
    color: colors.gray[600],
  },
  statusText: {
    ...typography.caption,
    color: colors.gray[600],
    fontWeight: '600',
  },
  statusTextNew: {
    ...typography.caption,
    color: colors.flickBlue,
    fontWeight: '600',
  },
});


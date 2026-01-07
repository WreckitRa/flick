import { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/tokens';
import { ScreenContainer } from '@/components/ui';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { DailyGoalCard } from '@/components/ui/DailyGoalCard';
import { SurveyCard } from '@/components/ui/SurveyCard';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { triggerHaptic } from '@/lib/haptics';

// Helper function to get warm, friendly greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Hey there';
  } else if (hour >= 17 && hour < 22) {
    return 'Good evening';
  } else {
    return 'Still up';
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: surveys, isLoading, refetch, isRefetching } = api.survey.listSurveysForUser.useQuery();
  const { data: user } = api.auth.getCurrentUser.useQuery();
  
  const greeting = useMemo(() => getGreeting(), []);
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Calculate daily goal progress
  const dailyGoalCompleted = typeof surveys?.filter(s => s.hasAnswered).length === 'number' ? surveys.filter(s => s.hasAnswered).length : 0;
  const dailyGoalTotal = typeof surveys?.length === 'number' ? surveys.length : 0;
  const totalCoinsEarned = typeof user?.profile?.totalCoins === 'number' && !isNaN(user.profile.totalCoins) ? user.profile.totalCoins : 0;
  const todayCoinsEarned = typeof surveys?.reduce((sum, s) => sum + (s.hasAnswered ? s.coinsReward : 0), 0) === 'number' ? surveys.reduce((sum, s) => sum + (s.hasAnswered ? s.coinsReward : 0), 0) : 0;

  const handleSurveyPress = (surveyId: string, hasAnswered: boolean) => {
    triggerHaptic('light').catch(() => {});
    if (hasAnswered) {
      // TODO: Navigate to survey results/history
      return;
    }
    router.push(`/survey/${surveyId}`);
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>✨</Text>
          <ActivityIndicator size="large" color={colors.flickTeal} />
          <Text style={styles.loadingText}>Loading your rewards...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const hasStreak = !!(user?.profile?.currentStreak && typeof user.profile.currentStreak === 'number' && user.profile.currentStreak > 0);

  return (
    <ScreenContainer padding={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.flickTeal} />
        }
      >
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <View style={styles.heroTop}>
            {/* Greeting */}
            <View style={styles.heroGreeting}>
              <Text style={styles.greeting}>
                {greeting}
                {user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! 👋
              </Text>
              <Text style={styles.heroSubtext}>
                {dailyGoalCompleted === dailyGoalTotal && dailyGoalTotal > 0
                  ? "Amazing work today! You crushed it ✨"
                  : dailyGoalCompleted > 0 
                    ? `You're on a roll! Just ${String(Math.max(0, dailyGoalTotal - dailyGoalCompleted))} more to go 🚀`
                    : "Ready to earn some Flick Coins? Let's go! 💫"}
              </Text>
            </View>

            {/* Stats Overview Card - Compact */}
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                {/* Total Coins */}
                <View style={styles.coinsCompact}>
                  <View style={styles.coinsIconSmall}>
                    <Text style={styles.coinsIconText}>🪙</Text>
                  </View>
                  <View style={styles.coinsInfoCompact}>
                    <Text style={styles.coinsLabelCompact}>Flick Coins</Text>
                    <Text style={styles.coinsAmountCompact}>{String(totalCoinsEarned || 0)}</Text>
                  </View>
                </View>

                {/* Level + Streak Row */}
                <View style={styles.badgesRow}>
                  {/* Level Badge */}
                  {typeof totalCoinsEarned === 'number' && !isNaN(totalCoinsEarned) && isFinite(totalCoinsEarned) ? (
                    <View style={styles.levelBadgeCompact}>
                      <Text style={styles.levelTextCompact}>
                        LV {String(Math.max(1, Math.floor(totalCoinsEarned / 100) + 1))}
                      </Text>
                    </View>
                  ) : null}

                  {/* Streak Badge */}
                  {hasStreak && user.profile && typeof user.profile.currentStreak === 'number' ? (
                    <StreakBadge
                      streak={user.profile.currentStreak}
                      bestStreak={user.profile.longestStreak}
                      size="small"
                    />
                  ) : null}
                </View>
              </View>

              {/* Progress Bar Below */}
              {typeof totalCoinsEarned === 'number' && !isNaN(totalCoinsEarned) && isFinite(totalCoinsEarned) ? (
                <View style={styles.progressSection}>
                  <View style={styles.progressBarCompact}>
                    <View 
                      style={[
                        styles.progressFillCompact,
                        { width: `${Math.max(0, Math.min(100, ((totalCoinsEarned % 100) / 100) * 100))}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressTextCompact}>
                    {String(Math.max(0, Math.min(100, 100 - (totalCoinsEarned % 100))))} to LV {String(Math.max(1, Math.floor(totalCoinsEarned / 100) + 2))}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.contentSection,
            {
              opacity: contentFade,
            },
          ]}
        >
          {/* Daily Goal Card */}
          {surveys && surveys.length > 0 ? (
            <DailyGoalCard
              completed={dailyGoalCompleted}
              total={dailyGoalTotal}
              coinsEarned={todayCoinsEarned}
            />
          ) : null}

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>
                {dailyGoalCompleted === 0 
                  ? '💫 Start Your Journey'
                  : dailyGoalCompleted === dailyGoalTotal
                    ? '✨ Mission Complete!'
                    : `🚀 ${String(Math.max(0, dailyGoalTotal - dailyGoalCompleted))} Left to Go`
                }
              </Text>
              <Text style={styles.sectionSubtitle}>
                {dailyGoalCompleted === dailyGoalTotal
                  ? "You're a star! See you tomorrow for more"
                  : 'Share your insights and earn Flick Coins'}
              </Text>
            </View>
            {surveys && surveys.length > 0 ? (
              <View style={[
                styles.surveyCountBadge,
                dailyGoalCompleted === dailyGoalTotal && styles.surveyCountBadgeComplete
              ]}>
                <Text style={styles.surveyCountText}>
                  {dailyGoalCompleted === dailyGoalTotal ? '✓' : String(surveys.length || 0)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Surveys List */}
          {!surveys || surveys.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCircle}>
                <Text style={styles.emptyEmoji}>🎉</Text>
              </View>
              <Text style={styles.emptyTitle}>You're All Set!</Text>
              <Text style={styles.emptySubtext}>
                Check back tomorrow for fresh insights and new ways to earn
              </Text>
              <View style={styles.emptyStats}>
                <View style={styles.emptyStat}>
                  <Text style={styles.emptyStatValue}>{String(totalCoinsEarned || 0)}</Text>
                  <Text style={styles.emptyStatLabel}>Flick Coins</Text>
                </View>
                <View style={styles.emptyDivider} />
                <View style={styles.emptyStat}>
                  <Text style={styles.emptyStatValue}>{String((hasStreak && user.profile && typeof user.profile.currentStreak === 'number') ? user.profile.currentStreak : 0)}</Text>
                  <Text style={styles.emptyStatLabel}>Day Streak 🔥</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.surveysList}>
              {surveys.map((survey, index) => (
                <SurveyCard
                  key={survey.id}
                  title={survey.title}
                  description={survey.description || undefined}
                  questionCount={survey.questionCount}
                  coinsReward={survey.coinsReward}
                  hasAnswered={survey.hasAnswered}
                  onPress={() => handleSurveyPress(survey.id, survey.hasAnswered)}
                  delay={300 + index * 100}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.background.secondary,
  },
  loadingEmoji: {
    fontSize: 64,
    textAlign: 'center',
  },
  loadingText: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  heroSection: {
    backgroundColor: colors.background.elevated,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    shadowColor: colors.flickTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  heroTop: {
    gap: spacing.lg,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroText: {
    flex: 1,
    marginRight: spacing.md,
  },
  greeting: {
    ...typography.largeTitle,
    fontSize: 32,
    color: colors.gray[900],
    fontWeight: '900',
    marginBottom: spacing.xs,
    letterSpacing: -1,
    lineHeight: 38,
  },
  heroSubtext: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  heroGreeting: {
    marginBottom: spacing.sm,
  },
  // Stats Overview Card - Compact Version
  statsCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.flickGold,
    borderBottomWidth: 4,
    ...shadows.brand.gold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  coinsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  coinsIconSmall: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.flickGold,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.brand.gold,
  },
  coinsIconText: {
    fontSize: 28,
  },
  coinsInfoCompact: {
    flex: 1,
  },
  coinsLabelCompact: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: 2,
    textTransform: 'uppercase' as const,
  },
  coinsAmountCompact: {
    ...typography.largeTitle,
    fontSize: 28,
    color: colors.text.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  levelBadgeCompact: {
    backgroundColor: colors.flickPurple,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 2,
    borderRadius: borderRadius.full,
    ...shadows.brand.purple,
  },
  levelTextCompact: {
    ...typography.label,
    color: colors.text.inverse,
  },
  progressSection: {
    gap: spacing.xs - 2,
  },
  progressBarCompact: {
    height: 5,
    backgroundColor: colors.flickPurpleLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFillCompact: {
    height: '100%',
    backgroundColor: colors.flickPurple,
    borderRadius: borderRadius.full,
  },
  progressTextCompact: {
    ...typography.label,
    fontSize: 10,
    color: colors.text.tertiary,
  },
  contentSection: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  surveyCountBadge: {
    backgroundColor: colors.flickGold,
    minWidth: 48,
    height: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.flickGoldDark,
    borderBottomWidth: 5,
    ...shadows.brand.gold,
  },
  surveyCountBadgeComplete: {
    backgroundColor: colors.success,
    borderColor: '#059669',
    shadowColor: colors.success,
  },
  surveyCountText: {
    ...typography.title,
    fontSize: 20,
    color: colors.black,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl + spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 24,
    marginTop: spacing.md,
    borderWidth: 3,
    borderColor: colors.success,
    borderBottomWidth: 6,
    borderBottomColor: '#059669',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: colors.success,
  },
  emptyEmoji: {
    fontSize: 52,
    textAlign: 'center',
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 26,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  emptySubtext: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
    fontWeight: '600',
    marginBottom: spacing.xl,
  },
  emptyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  emptyStat: {
    alignItems: 'center',
  },
  emptyStatValue: {
    ...typography.largeTitle,
    fontSize: 36,
    color: colors.flickTeal,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  emptyStatLabel: {
    ...typography.caption,
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyDivider: {
    width: 2,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  surveysList: {
    paddingBottom: spacing.md,
  },
});


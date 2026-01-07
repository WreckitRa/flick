import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

interface DailyGoalCardProps {
  completed: number;
  total: number;
  coinsEarned: number;
}

export function DailyGoalCard({ completed, total, coinsEarned }: DailyGoalCardProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: completed / total,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();
  }, [completed, total]);

  const progress = (completed / total) * 100;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Daily Quest</Text>
          <Text style={styles.subtitle}>
            {String(completed || 0)} of {String(total || 0)} insights shared
          </Text>
        </View>
        <View style={styles.coinsContainer}>
          <Text style={styles.coinsEmoji}>🪙</Text>
          <Text style={styles.coinsAmount}>{String(coinsEarned || 0)}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{String(Math.round(progress || 0))}%</Text>
      </View>

      {progress >= 100 && (
        <View style={styles.completeBadge}>
          <Text style={styles.completeText}>✨ Quest complete! You're amazing!</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.flickTeal,
    borderBottomWidth: 4,
    shadowColor: colors.flickTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.flickGold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  coinsEmoji: {
    fontSize: 18,
  },
  coinsAmount: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.flickTeal,
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.flickTeal,
    minWidth: 45,
  },
  completeBadge: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  completeText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
});


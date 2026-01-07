import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, typography } from '@/lib/tokens';

interface StreakBadgeProps {
  streak: number;
  bestStreak?: number;
  size?: 'small' | 'medium';
}

export function StreakBadge({ streak, bestStreak, size = 'medium' }: StreakBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Ensure streak is a valid number
  const safeStreak = typeof streak === 'number' && !isNaN(streak) && isFinite(streak) ? Math.max(0, Math.floor(streak)) : 0;
  const safeBestStreak = typeof bestStreak === 'number' && !isNaN(bestStreak) && isFinite(bestStreak) ? Math.max(0, Math.floor(bestStreak)) : undefined;

  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const containerStyle = size === 'small' ? styles.containerSmall : styles.containerMedium;
  const emojiStyle = size === 'small' ? styles.emojiSmall : styles.emojiMedium;
  const textStyle = size === 'small' ? styles.textSmall : styles.textMedium;
  const bestStyle = size === 'small' ? styles.bestSmall : styles.bestMedium;

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        {
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
    >
      <Text style={[styles.emoji, emojiStyle]}>🔥</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.streakText, textStyle]}>
          {String(safeStreak)} day{safeStreak !== 1 ? 's' : ''}
        </Text>
        {safeBestStreak && safeBestStreak > safeStreak && (
          <Text style={[styles.bestText, bestStyle]}>
            Best: {String(safeBestStreak)}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.flickGold,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  emoji: {
    marginRight: spacing.xs,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakText: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  bestText: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
  containerSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emojiSmall: {
    fontSize: 16,
  },
  textSmall: {
    ...typography.caption,
    fontSize: 12,
  },
  bestSmall: {
    ...typography.caption,
    fontSize: 11,
  },
  containerMedium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emojiMedium: {
    fontSize: 20,
  },
  textMedium: {
    ...typography.body,
  },
  bestMedium: {
    ...typography.caption,
  },
});



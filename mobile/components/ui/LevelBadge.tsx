import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

interface LevelBadgeProps {
  totalCoins: number;
  delay?: number;
}

export function LevelBadge({ totalCoins, delay = 0 }: LevelBadgeProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Ensure totalCoins is a valid number
  const safeTotalCoins = typeof totalCoins === 'number' && !isNaN(totalCoins) && isFinite(totalCoins) ? Math.max(0, totalCoins) : 0;

  // Calculate level (every 100 coins = 1 level)
  const level = Math.max(1, Math.floor(safeTotalCoins / 100) + 1);
  const coinsInCurrentLevel = safeTotalCoins % 100;
  const coinsToNextLevel = Math.max(0, Math.min(100, 100 - coinsInCurrentLevel));
  const progress = Math.max(0, Math.min(100, (coinsInCurrentLevel / 100) * 100));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LV {String(level)}</Text>
        </View>
        <Text style={styles.coinsToNext}>{String(coinsToNextLevel)} to next level</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.flickPurple,
    shadowColor: colors.flickPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  levelBadge: {
    backgroundColor: colors.flickPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    shadowColor: colors.flickPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  levelText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  coinsToNext: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginTop: spacing.xs,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.flickPurpleLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.flickPurple,
    borderRadius: borderRadius.full,
  },
});



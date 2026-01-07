import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  delay?: number;
}

export function AchievementBadge({ title, description, icon, unlocked, delay = 0 }: AchievementBadgeProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
        unlocked ? styles.unlocked : styles.locked,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.iconContainer, unlocked && styles.iconContainerUnlocked]}>
        <Text style={[styles.icon, !unlocked && styles.iconLocked]}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !unlocked && styles.titleLocked]}>{title}</Text>
        <Text style={[styles.description, !unlocked && styles.descriptionLocked]}>
          {description}
        </Text>
      </View>
      {unlocked && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 3,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  unlocked: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
    borderBottomWidth: 5,
  },
  locked: {
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
    opacity: 0.5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.flickGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 3,
    borderColor: colors.flickGoldDark,
    shadowColor: colors.flickGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainerUnlocked: {
    backgroundColor: colors.flickGold,
  },
  icon: {
    fontSize: 32,
  },
  iconLocked: {
    opacity: 0.3,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontSize: 17,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  titleLocked: {
    color: colors.gray[400],
  },
  description: {
    ...typography.caption,
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
    fontWeight: '500',
  },
  descriptionLocked: {
    color: colors.gray[400],
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.elevated,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  checkmarkText: {
    fontSize: 18,
    color: colors.text.inverse,
    fontWeight: '800',
  },
});


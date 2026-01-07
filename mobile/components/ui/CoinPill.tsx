import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

interface CoinPillProps {
  amount: number;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

export function CoinPill({ amount, size = 'medium', animated = false }: CoinPillProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, amount]);

  const sizeStyles = {
    small: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      fontSize: typography.caption.fontSize,
    },
    medium: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      fontSize: typography.body.fontSize,
    },
    large: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      fontSize: typography.bodyLarge.fontSize,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: currentSize.fontSize }]}>🪙</Text>
      <Text
        style={[
          styles.amount,
          {
            fontSize: currentSize.fontSize,
            fontWeight: size === 'large' ? 'bold' : '600',
          },
        ]}
      >
        {amount}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.flickGold,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  emoji: {
    lineHeight: 20,
  },
  amount: {
    color: colors.text.primary,
  },
});



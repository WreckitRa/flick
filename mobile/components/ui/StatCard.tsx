import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  delay?: number;
}

export function StatCard({ label, value, icon, color = colors.flickTeal, delay = 0 }: StatCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  const [displayValue, setDisplayValue] = React.useState(typeof value === 'number' ? 0 : value);

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 800;
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }
  }, [value]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          borderLeftColor: color,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.value, { color }]}>
          {typeof value === 'number' ? displayValue : value}
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 3,
    borderLeftWidth: 6,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 36,
  },
  content: {
    flex: 1,
  },
  value: {
    ...typography.title,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: spacing.xs,
    letterSpacing: -1.2,
  },
  label: {
    ...typography.body,
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '600',
  },
});


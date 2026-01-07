import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

interface ProgressBarProps {
  progress: number; // 0-100
  current?: number;
  total?: number;
  showText?: boolean;
  height?: number;
  color?: string;
}

export function ProgressBar({ 
  progress, 
  current, 
  total, 
  showText = true,
  height = 8,
  color = colors.flickTeal,
}: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <View style={[styles.barContainer, { height }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: color,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      {showText && current !== undefined && total !== undefined && (
        <Text style={styles.text}>
          {current} of {total}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginBottom removed - controlled by parent
  },
  barContainer: {
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  text: {
    ...typography.caption,
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});


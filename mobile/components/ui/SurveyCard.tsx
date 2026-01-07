import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';
import { CoinPill } from './CoinPill';
import { triggerHaptic } from '@/lib/haptics';

interface SurveyCardProps {
  title: string;
  description?: string;
  questionCount: number;
  coinsReward: number;
  hasAnswered: boolean;
  onPress: () => void;
  delay?: number;
}

export function SurveyCard({
  title,
  description,
  questionCount,
  coinsReward,
  hasAnswered,
  onPress,
  delay = 0,
}: SurveyCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity
        style={[
          styles.card,
          hasAnswered ? styles.cardAnswered : styles.cardActive,
        ]}
        onPress={() => {
          triggerHaptic('light').catch(() => {});
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {hasAnswered && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✓ Completed</Text>
              </View>
            )}
          </View>
          <View style={styles.coinWrapper}>
            <CoinPill amount={coinsReward} size="medium" />
          </View>
        </View>

        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {questionCount} {questionCount === 1 ? 'question' : 'questions'}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>~{Math.ceil(questionCount * 0.5)} min</Text>
          </View>
          {hasAnswered ? (
            <View style={styles.statusCompleted}>
              <Text style={styles.statusText}>Done</Text>
            </View>
          ) : (
            <View style={styles.statusNew}>
              <Text style={styles.statusTextNew}>Start</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg + spacing.sm,
    marginBottom: spacing.md,
    shadowColor: colors.flickTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardActive: {
    borderWidth: 3,
    borderColor: colors.flickTeal,
    borderBottomWidth: 5,
  },
  cardAnswered: {
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    lineHeight: 28,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[700],
    letterSpacing: 0.3,
  },
  coinWrapper: {
    marginTop: -spacing.xs,
  },
  description: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[600],
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  metaDot: {
    ...typography.caption,
    fontSize: 13,
    color: colors.gray[400],
  },
  statusCompleted: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[200],
  },
  statusText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  },
  statusNew: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.flickTeal,
  },
  statusTextNew: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
});


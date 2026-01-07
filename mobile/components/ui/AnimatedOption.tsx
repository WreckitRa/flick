import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';
import { triggerHaptic } from '@/lib/haptics';

interface AnimatedOptionProps {
  emoji?: string;
  text: string;
  isSelected: boolean;
  onPress: () => void;
  delay?: number;
  style?: ViewStyle;
  variant?: 'default' | 'trueFalse' | 'rating';
  isRatingNumber?: boolean; // true if it's a number rating (1-5), false if emoji rating
}

export function AnimatedOption({
  emoji,
  text,
  isSelected,
  onPress,
  delay = 0,
  style,
  variant = 'default',
  isRatingNumber = false,
}: AnimatedOptionProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isSelected) {
      triggerHaptic('medium').catch(() => {});
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          tension: 300,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  // For rating variant, determine display mode:
  // - If emoji exists: show emoji ONLY
  // - If no emoji: show number ONLY
  const isRatingVariant = variant === 'rating';
  const isTrueFalseVariant = variant === 'trueFalse';
  const showEmojiOnly = isRatingVariant && emoji;
  const showNumberOnly = isRatingVariant && !emoji;

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
        (variant === 'rating' || variant === 'trueFalse') && { flex: 1 },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.option,
          variant === 'trueFalse' && styles.optionTrueFalse,
          variant === 'rating' && styles.optionRating,
          isSelected && styles.optionSelected,
          isSelected && variant === 'rating' && styles.optionRatingSelected,
          style,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {showEmojiOnly ? (
          <Text style={styles.ratingEmojiLarge}>{emoji}</Text>
        ) : showNumberOnly ? (
          <Text style={[styles.ratingNumber, isSelected && styles.ratingNumberSelected]}>
            {text}
          </Text>
        ) : isTrueFalseVariant ? (
          <Text style={[styles.trueFalseText, isSelected && styles.trueFalseTextSelected]}>
            {text}
          </Text>
        ) : (
          <>
            {emoji && <Text style={styles.emoji}>{emoji}</Text>}
            <Text style={[styles.text, isSelected && styles.textSelected]}>
              {text}
            </Text>
            {isSelected && variant !== 'rating' && (
              <Animated.View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </Animated.View>
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 3,
    borderColor: colors.gray[200],
    borderBottomWidth: 5,
    minHeight: 56,
  },
  optionTrueFalse: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 84,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  optionRating: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 68,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    flex: 1,
  },
  optionSelected: {
    backgroundColor: colors.flickTeal,
    borderColor: colors.flickTealDark,
  },
  optionRatingSelected: {
    transform: [{ scale: 1.05 }],
  },
  emoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  ratingEmojiLarge: {
    fontSize: 40,
    textAlign: 'center',
  },
  ratingNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.gray[900],
    textAlign: 'center',
    lineHeight: 26,
  },
  ratingNumberSelected: {
    color: colors.white,
  },
  trueFalseText: {
    ...typography.body,
    fontSize: 19,
    fontWeight: '800',
    color: colors.gray[900],
    textAlign: 'center',
    lineHeight: 26,
  },
  trueFalseTextSelected: {
    color: colors.white,
  },
  text: {
    ...typography.body,
    fontSize: 16,
    flex: 1,
    color: colors.gray[900],
    fontWeight: '600',
  },
  textSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  checkmarkContainer: {
    marginLeft: spacing.sm,
  },
  checkmark: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
});


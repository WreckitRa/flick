import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';
import { triggerHaptic } from '@/lib/haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = true,
  icon,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    triggerHaptic('light').catch(() => {});
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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

  const variantStyles = {
    primary: {
      backgroundColor: colors.flickTeal,
      textColor: colors.text.inverse,
      shadowColor: colors.flickTeal,
      borderColor: colors.flickTealDark,
    },
    secondary: {
      backgroundColor: colors.flickGold,
      textColor: colors.text.primary,
      shadowColor: colors.flickGold,
      borderColor: colors.flickGoldDark,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: colors.flickTeal,
      shadowColor: 'transparent',
      borderColor: colors.flickTeal,
    },
    success: {
      backgroundColor: colors.success,
      textColor: colors.text.inverse,
      shadowColor: colors.success,
      borderColor: colors.success,
    },
  };

  const currentVariant = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && styles.fullWidth]}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: currentVariant.backgroundColor,
                borderWidth: variant === 'ghost' ? 2 : 3,
                borderColor: variant === 'ghost' ? currentVariant.borderColor : currentVariant.borderColor,
                borderBottomWidth: variant === 'ghost' ? 2 : 5,
                opacity: isDisabled ? 0.5 : 1,
                shadowColor: currentVariant.shadowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: variant === 'ghost' ? 0 : 0.25,
                shadowRadius: 8,
                elevation: variant === 'ghost' ? 0 : 4,
              },
              style,
            ]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isDisabled}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator
                color={currentVariant.textColor}
                size="small"
              />
            ) : (
              <View style={styles.buttonContent}>
                {icon && <Text style={styles.icon}>{icon}</Text>}
                <Text
                  style={[
                    styles.text,
                    { color: currentVariant.textColor },
                    textStyle,
                  ]}
                >
                  {title}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: colors.flickTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: {
    fontSize: 20,
  },
  text: {
    ...typography.body,
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
});


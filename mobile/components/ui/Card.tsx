import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '@/lib/tokens';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'highlighted' | 'subtle';
}

export function Card({ children, onPress, style, variant = 'default' }: CardProps) {
  const variantStyles = {
    default: {
      backgroundColor: colors.background.elevated,
      borderColor: colors.gray[200],
      borderWidth: 1,
    },
    highlighted: {
      backgroundColor: colors.background.elevated,
      borderColor: colors.flickTeal,
      borderWidth: 2,
    },
    subtle: {
      backgroundColor: colors.gray[100],
      borderColor: 'transparent',
      borderWidth: 0,
    },
  };

  const currentVariant = variantStyles[variant];

  const cardStyle = [
    styles.card,
    {
      backgroundColor: currentVariant.backgroundColor,
      borderColor: currentVariant.borderColor,
      borderWidth: currentVariant.borderWidth,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.flickTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});



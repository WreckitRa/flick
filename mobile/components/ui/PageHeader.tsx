import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '@/lib/tokens';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function PageHeader({ title, subtitle, rightAction, style }: PageHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.rightAction}>
            <Text style={styles.rightActionText}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.largeTitle,
    color: colors.flickTeal,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray[600],
  },
  rightAction: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  rightActionText: {
    ...typography.body,
    color: colors.flickTeal,
    fontWeight: '600',
  },
});



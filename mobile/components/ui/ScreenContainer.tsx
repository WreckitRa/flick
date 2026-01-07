import React from 'react';
import { View, StyleSheet, ViewStyle, SafeAreaView } from 'react-native';
import { colors, spacing } from '@/lib/tokens';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  padding?: boolean;
}

export function ScreenContainer({
  children,
  style,
  safeArea = true,
  padding = true,
}: ScreenContainerProps) {
  const containerStyle = [
    styles.container,
    padding && styles.padding,
    style,
  ];

  if (safeArea) {
    return (
      <SafeAreaView style={containerStyle}>
        {children}
      </SafeAreaView>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  padding: {
    paddingHorizontal: spacing.lg,
  },
});


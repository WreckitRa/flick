import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = '@flick_onboarding_completed';

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
  onAnswerFirstQuestion?: () => void;
  onLogin?: () => void;
}

export function Onboarding({ onComplete, onSkip, onAnswerFirstQuestion, onLogin }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const coinScale = useRef(new Animated.Value(1)).current;

  const screens = [
    {
      title: 'Your opinions are valuable.',
      subtitle:
        'At Flick, your feedback helps restaurants, clubs, and brands do better — and you get rewarded for it.',
      visual: '💬',
      accentColor: colors.flickYellow,
    },
    {
      title: 'Quick questions. Real rewards.',
      bullets: [
        'Answer simple, fun questions',
        'Collect Flick Coins in minutes',
        'No long surveys, no effort',
      ],
      visual: '⚡',
      accentColor: colors.flickYellow,
    },
    {
      title: 'Rewards made for you.',
      subtitle:
        'Redeem Flick Coins for personalized rewards from places you actually like — top brands, restaurants, and experiences.',
      visual: '🪙',
      accentColor: colors.flickYellow,
      showCoin: true,
    },
    {
      title: 'Learn more about yourself.',
      subtitle:
        'See how your choices compare to the Lebanese community — habits, trends, and insights about you.',
      visual: '📊',
      accentColor: colors.flickBlue,
    },
  ];

  const handleNext = () => {
    if (currentIndex < screens.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    // Mark onboarding as completed on backend (device-level) - non-blocking
    markDeviceOnboardingComplete().catch(console.error);
    onSkip(); // Goes directly to guest survey
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    // Mark onboarding as completed on backend (device-level) - non-blocking
    markDeviceOnboardingComplete().catch(console.error);
    onComplete(); // Shows final screen with CTAs
  };

  // Helper function to mark device onboarding as complete on backend
  const markDeviceOnboardingComplete = async () => {
    try {
      const { getDeviceId } = await import('@/lib/device');
      const deviceId = await getDeviceId();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      
      // tRPC mutation endpoint format
      await fetch(`${apiUrl}/trpc/auth.completeDeviceOnboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: { deviceId },
        }),
      });
    } catch (error) {
      console.error('Error marking device onboarding complete:', error);
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      // Animate coin on screen 3
      if (index === 2) {
        Animated.sequence([
          Animated.timing(coinScale, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(coinScale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  const renderScreen = (screen: (typeof screens)[0], index: number) => {
    const isLast = index === screens.length - 1;

    return (
      <View key={index} style={styles.screen}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.visualContainer}>
            <Text style={styles.visual}>{screen.visual}</Text>
            {screen.showCoin && (
              <Animated.View
                style={[
                  styles.coinBadge,
                  {
                    backgroundColor: screen.accentColor,
                    transform: [{ scale: coinScale }],
                  },
                ]}
              >
                <Text style={styles.coinText}>🪙</Text>
              </Animated.View>
            )}
          </View>

          <Text style={styles.title}>{screen.title}</Text>

          {screen.subtitle && <Text style={styles.subtitle}>{screen.subtitle}</Text>}

          {screen.bullets && (
            <View style={styles.bulletsContainer}>
              {screen.bullets.map((bullet, i) => (
                <View key={i} style={styles.bullet}>
                  <Text style={styles.bulletText}>• {bullet}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.buttonContainer}>
            {isLast ? (
              <>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.flickYellow }]}
                  onPress={() => {
                    handleComplete();
                    onAnswerFirstQuestion?.();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.primaryButtonText, { color: colors.black }]}>
                    Answer your first question
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => {
                    handleComplete();
                    onLogin?.();
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.secondaryButtonTextSmall}>Log in</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.flickBlue }]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    );
  };

  const isLastScreen = currentIndex === screens.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button - top right, subtle - only show if NOT on last screen */}
      {!isLastScreen && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Log in button - bottom, very subtle, only on first screen */}
      {currentIndex === 0 && (
        <TouchableOpacity
          style={styles.loginButton}
          onPress={async () => {
            // Set skip guest survey flag FIRST before any navigation
            try {
              const { setSkipGuestSurvey } = await import('@/lib/auth');
              await setSkipGuestSurvey();
            } catch (error) {
              console.error('Error setting skip guest survey flag:', error);
            }
            // Mark onboarding as complete (without calling onSkip which navigates to guest survey)
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
            // Mark onboarding as completed on backend (device-level) - non-blocking
            markDeviceOnboardingComplete().catch(console.error);
            // Navigate directly to login (don't call onSkip which would go to guest survey)
            onLogin?.();
          }}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {screens.map((screen, index) => renderScreen(screen, index))}
      </ScrollView>

      <View style={styles.progressContainer}>
        {screens.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentIndex && styles.progressDotActive,
              index === currentIndex && {
                backgroundColor: colors.flickBlue,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.xl + spacing.md,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.body,
    color: colors.gray[600],
    fontWeight: '500',
  },
  loginButton: {
    position: 'absolute',
    bottom: spacing.xl + spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    padding: spacing.sm,
  },
  loginButtonText: {
    ...typography.caption,
    color: colors.gray[600],
    fontSize: 13,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  visual: {
    fontSize: 80,
  },
  coinBadge: {
    position: 'absolute',
    top: -spacing.sm,
    right: -spacing.md,
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coinText: {
    fontSize: 24,
  },
  title: {
    ...typography.title,
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  bulletsContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  bullet: {
    marginBottom: spacing.md,
  },
  bulletText: {
    ...typography.body,
    color: colors.gray[900],
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: spacing.md + spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.flickBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.gray[600],
  },
  secondaryButtonSmall: {
    width: '100%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  secondaryButtonTextSmall: {
    ...typography.caption,
    color: colors.gray[600],
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[200],
  },
  progressDotActive: {
    width: 24,
  },
});

export async function hasCompletedOnboarding(): Promise<boolean> {
  // First check local storage (fast)
  const localValue = await AsyncStorage.getItem(ONBOARDING_KEY);
  if (localValue === 'true') {
    return true;
  }

  // Then check backend (device-level persistence across reinstalls)
  try {
    const { getDeviceId } = await import('@/lib/device');
    const deviceId = await getDeviceId();
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Direct fetch to tRPC endpoint (query format)
    const input = encodeURIComponent(JSON.stringify({ json: { deviceId } }));
    const response = await fetch(`${apiUrl}/trpc/auth.checkDeviceOnboarding?input=${input}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const result = data.result?.data;
      
      if (result?.onboardingCompleted) {
        // Sync local storage
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        return true;
      }
    }
  } catch (error) {
    console.error('Error checking device onboarding status:', error);
    // Fallback to local storage if backend check fails
  }

  return false;
}


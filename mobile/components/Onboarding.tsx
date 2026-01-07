import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';
import { Button, ProgressDots, CoinPill } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';
import { getDeviceId } from '@/lib/device';
import { setSkipGuestSurvey } from '@/lib/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = '@flick_onboarding_completed';

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
  onAnswerFirstQuestion?: () => void;
  onLogin?: () => void;
}

// Animated Survey Demo Component
function SurveyDemo({ isVisible }: { isVisible: boolean }) {
  const options = [
    { id: 1, text: '👍 Yes!', emoji: '👍' },
    { id: 2, text: '👎 Nope', emoji: '👎' },
  ];

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const animValues = useRef(options.map(() => new Animated.Value(0))).current;
  const scaleValues = useRef(options.map(() => new Animated.Value(0.8))).current;
  const selectedScale = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isVisible) {
      // Clean up when not visible
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setSelectedId(null);
      animValues.forEach((anim) => anim.setValue(0));
      scaleValues.forEach((anim) => anim.setValue(0.8));
      selectedScale.setValue(1);
      return;
    }

    // Only run animation once when becoming visible
    if (selectedId !== null) return;

    // Animate options appearing one by one
    const animations = options.map((_, index) =>
      Animated.parallel([
        Animated.timing(animValues[index], {
          toValue: 1,
          duration: 300,
          delay: index * 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleValues[index], {
          toValue: 1,
          delay: index * 150,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ])
    );

    const mainAnimation = Animated.sequence([
      // First, show all options
      Animated.parallel(animations),
      // Wait a bit
      Animated.delay(800),
      // Then select one
      Animated.timing(selectedScale, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }),
    ]);

    mainAnimation.start(() => {
      if (!isVisible) return;
      
      // Select the first option (Yes)
      setSelectedId(1);
      Animated.spring(selectedScale, {
        toValue: 1.05,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start(() => {
        if (!isVisible) return;
        
        Animated.spring(selectedScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      });

      // Loop the animation after delay
      timeoutRef.current = setTimeout(() => {
        if (!isVisible) return;
        setSelectedId(null);
        animValues.forEach((anim) => anim.setValue(0));
        scaleValues.forEach((anim) => anim.setValue(0.8));
        selectedScale.setValue(1);
      }, 2000);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isVisible, selectedId]);

  return (
    <View style={demoStyles.container}>
      <Text style={demoStyles.question}>Do you like coffee? ☕</Text>
      <View style={demoStyles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selectedId === option.id;
          return (
            <Animated.View
              key={option.id}
              style={[
                demoStyles.option,
                isSelected && demoStyles.optionSelected,
                {
                  opacity: animValues[index],
                  transform: [
                    {
                      scale: isSelected ? selectedScale : scaleValues[index],
                    },
                  ],
                },
              ]}
            >
              <Text style={[demoStyles.optionText, isSelected && demoStyles.optionTextSelected]}>
                {option.text}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const demoStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 3,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: spacing.md,
    width: '100%',
    minHeight: 160,
  },
  question: {
    ...typography.body,
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 26,
    paddingHorizontal: spacing.xs,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderWidth: 3,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  optionSelected: {
    backgroundColor: colors.flickTeal,
    borderColor: colors.flickTealDark,
    borderBottomWidth: 5,
  },
  optionText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
});

export function Onboarding({ onComplete, onSkip, onAnswerFirstQuestion, onLogin }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const coinScale = useRef(new Animated.Value(1)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Animate emoji entrance
    Animated.spring(emojiScale, {
      toValue: 1,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const screens = [
    {
      title: `Your Voice.\nYour Rewards. 💪`,
      subtitle:
        'Shape what you love — restaurants, brands, experiences. Get paid in coins for every answer.',
      visual: '🎯',
      accentColor: colors.flickTeal,
      bgColor: colors.flickTealLight,
    },
    {
      title: `Quick & Fun\nSurveys 🎮`,
      subtitle:
        'Simple questions. Instant rewards. Takes just 30 seconds per survey.',
      visual: '⚡',
      accentColor: colors.flickGold,
      bgColor: colors.flickGoldLight,
      showDemo: true,
    },
    {
      title: `Real Rewards\nYou'll Love 🎁`,
      subtitle:
        'Get personalized rewards based on your location and preferences — top restaurants, brands, and experiences near you.',
      visual: '🪙',
      accentColor: colors.flickGold,
      bgColor: colors.flickGoldLight,
      showCoin: true,
    },
    {
      title: `Be Part of\nSomething Big 🚀`,
      subtitle:
        'See how Lebanon thinks. Compare your choices with thousands. Help brands improve.',
      visual: '📊',
      accentColor: colors.flickPurple,
      bgColor: colors.flickPurpleLight,
    },
  ];

  const handleNext = () => {
    triggerHaptic('medium').catch(() => {});
    // Reset emoji animation for next screen
    emojiScale.setValue(0);
    
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
      // Reset emoji animation for new screen
      emojiScale.setValue(0);
      Animated.spring(emojiScale, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }).start();
      
      // Animate coin on screen 3
      if (index === 2) {
        Animated.sequence([
          Animated.spring(coinScale, {
            toValue: 1.3,
            tension: 20,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(coinScale, {
            toValue: 1,
            tension: 30,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  const renderScreen = (screen: (typeof screens)[0], index: number) => {
    const isLast = index === screens.length - 1;

    return (
      <View key={index} style={[styles.screen, { backgroundColor: screen.bgColor }]}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.topSection}>
            <View style={styles.visualContainer}>
              <Animated.View
                style={[
                  styles.emojiCircle,
                  {
                    backgroundColor: screen.accentColor,
                    borderColor: screen.accentColor,
                    transform: [{ scale: emojiScale }],
                  },
                ]}
              >
                <View style={styles.emojiWrapper}>
                  <Text style={styles.visual}>{screen.visual}</Text>
                </View>
              </Animated.View>
              {screen.showCoin && (
                <Animated.View
                  style={{
                    transform: [{ scale: coinScale }],
                    marginTop: spacing.lg,
                    alignItems: 'center',
                  }}
                >
                  <CoinPill amount={10} size="large" animated />
                </Animated.View>
              )}
            </View>

            <Text style={[styles.title, { color: screen.accentColor }]}>{screen.title}</Text>

            {screen.subtitle && <Text style={styles.subtitle}>{screen.subtitle}</Text>}

            {/* Show survey demo on second screen (index 1) */}
            {screen.showDemo && <SurveyDemo isVisible={currentIndex === index} />}
          </View>

          <View style={styles.buttonContainer}>
            {isLast ? (
              <>
                <Button
                  title="Start Earning Now 🚀"
                  onPress={() => {
                    triggerHaptic('success').catch(() => {});
                    handleComplete();
                    onAnswerFirstQuestion?.();
                  }}
                  variant="secondary"
                  style={styles.primaryButton}
                />
                <Button
                  title="I already have an account"
                  onPress={() => {
                    handleComplete();
                    onLogin?.();
                  }}
                  variant="ghost"
                  style={styles.secondaryButtonSmall}
                />
              </>
            ) : (
              <Button
                title="Continue"
                onPress={handleNext}
                variant="primary"
                style={styles.primaryButton}
              />
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
        <ProgressDots
          total={screens.length}
          current={currentIndex}
          color={screens[currentIndex].accentColor}
        />
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
    fontSize: 16,
    color: colors.gray[700],
    fontWeight: '600',
  },
  loginButton: {
    position: 'absolute',
    bottom: spacing.xl + spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  loginButtonText: {
    ...typography.body,
    color: colors.gray[600],
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.xl,
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emojiCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  emojiWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visual: {
    fontSize: 64,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 70,
  },
  title: {
    ...typography.largeTitle,
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    lineHeight: 42,
    letterSpacing: -1.5,
  },
  subtitle: {
    ...typography.body,
    fontSize: 18,
    color: colors.gray[700],
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: spacing.lg,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  primaryButton: {
    marginBottom: 0,
  },
  secondaryButtonSmall: {
    marginTop: 0,
  },
  progressContainer: {
    paddingBottom: spacing.xl + spacing.md,
    alignItems: 'center',
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


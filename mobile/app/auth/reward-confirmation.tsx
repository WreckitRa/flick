import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { getGuestCoinsEarned, hasCompletedGuestSurvey, clearGuestData } from '@/lib/guest';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/tokens';
import { ScreenContainer, Button, CoinPill, CoinBurst } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';

export default function RewardConfirmationScreen() {
  const router = useRouter();
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [hasGuestData, setHasGuestData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animations
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkRotate = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  // Get user info to check for guest data from backend
  const { data: userData } = api.auth.getCurrentUser.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    const checkGuestData = async () => {
      try {
        // Check local guest data first (before it's cleared)
        const guestCompleted = await hasCompletedGuestSurvey();
        let localCoins = 0;
        let hasLocalGuestData = false;
        
        if (guestCompleted) {
          localCoins = await getGuestCoinsEarned();
          hasLocalGuestData = localCoins > 0;
        }

        // This screen should ONLY show if user completed guest survey and signed up
        // If no guest data exists, redirect to home immediately
        if (!hasLocalGuestData || localCoins === 0) {
          console.log('[Reward Confirmation] No guest data found, redirecting to home');
          router.replace('/(tabs)');
          return;
        }

        // If we had local guest data, it should have been transferred to backend during signup
        // Clear local guest data since it's been transferred
        await clearGuestData();
        setCoinsEarned(localCoins);
        setHasGuestData(true);
        setIsLoading(false);

        // Trigger success haptic
        triggerHaptic('success').catch(() => {});

        // Staggered entrance animations
        Animated.sequence([
          // Checkmark pops in with bounce
          Animated.parallel([
            Animated.spring(checkmarkScale, {
              toValue: 1,
              tension: 60,
              friction: 6,
              useNativeDriver: true,
            }),
            Animated.timing(checkmarkRotate, {
              toValue: 1,
              duration: 400,
              easing: Easing.elastic(1.2),
              useNativeDriver: true,
            }),
          ]),
          // Then content fades and slides up
          Animated.delay(100),
          Animated.parallel([
            Animated.timing(contentFade, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.spring(contentSlide, {
              toValue: 0,
              tension: 60,
              friction: 8,
              useNativeDriver: true,
            }),
          ]),
          // Button appears last
          Animated.delay(150),
          Animated.timing(buttonFade, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

      } catch (error) {
        console.error('Error checking guest data:', error);
        // On error, redirect to home
        router.replace('/(tabs)');
      }
    };

    checkGuestData();
  }, [router]);

  const handleContinue = async () => {
    triggerHaptic('medium').catch(() => {});
    // Clear guest data now that we've shown the confirmation
    try {
      await clearGuestData();
    } catch (error) {
      console.error('Error clearing guest data:', error);
    }
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.flickTeal} />
        </View>
      </ScreenContainer>
    );
  }

  const rotateInterpolate = checkmarkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        {/* Checkmark with coin burst effect */}
        <View style={styles.iconContainer}>
          {coinsEarned > 0 && <CoinBurst amount={coinsEarned} />}
          <Animated.View
            style={[
              styles.checkmarkCircle,
              {
                transform: [
                  { scale: checkmarkScale },
                  { rotate: rotateInterpolate },
                ],
              },
            ]}
          >
            <Text style={styles.checkmark}>✓</Text>
          </Animated.View>
        </View>

        {/* Main content */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: contentFade,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          <Text style={styles.title}>Account Created!</Text>
          
          {hasGuestData && coinsEarned > 0 && (
            <>
              <Text style={styles.subtitle}>Your Flick Coins are now saved</Text>
              
              <View style={styles.coinsContainer}>
                <CoinPill amount={coinsEarned} size="large" animated />
              </View>
            </>
          )}
        </Animated.View>

        {/* Continue button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { opacity: buttonFade },
          ]}
        >
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="secondary"
            style={styles.continueButton}
          />
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.elevated,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconContainer: {
    position: 'relative',
    width: 180,
    height: 180,
    marginBottom: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.successLight,
    ...shadows.xl,
  },
  checkmark: {
    fontSize: 80,
    color: colors.text.inverse,
    fontWeight: '900',
    marginTop: -8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.largeTitle,
    fontSize: 36,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing.xl,
  },
  coinsContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.flickGoldLight,
    borderRadius: borderRadius.xl,
    borderWidth: 3,
    borderColor: colors.flickGold,
    borderBottomWidth: 6,
    borderBottomColor: colors.flickGoldDark,
    ...shadows.md,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  continueButton: {
    minHeight: 56,
  },
});



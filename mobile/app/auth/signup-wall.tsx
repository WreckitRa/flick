import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getGuestCoinsEarned } from '@/lib/guest';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/tokens';
import { ScreenContainer, Button, Confetti } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';

export default function SignupWallPage() {
  const router = useRouter();
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const loadCoins = async () => {
      const coins = await getGuestCoinsEarned();
      setCoinsEarned(coins);
      setIsLoading(false);

      // Show confetti celebration
      setShowConfetti(true);
      triggerHaptic('success').catch(() => {});
      
      // Stop confetti after 3 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);

      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for coins
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    loadCoins();
  }, []);

  if (isLoading) {
    return (
      <ScreenContainer style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      {showConfetti && <Confetti count={80} duration={3000} />}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Coins Display - Big and Bold */}
        <Animated.View style={[styles.coinsCard, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.coinsPretext}>You've Earned</Text>
          <View style={styles.coinsDisplay}>
            <Text style={styles.coinsAmount}>{coinsEarned}</Text>
            <Text style={styles.coinsIcon}>🪙</Text>
          </View>
          <Text style={styles.coinsLabel}>Flick Coins!</Text>
        </Animated.View>

        {/* Main Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Claim Your Rewards! 🚀</Text>
          <Text style={styles.subtitle}>
            Create your free account to save your coins and start earning more every day
          </Text>
        </View>

        {/* Quick Benefits - Compact */}
        <View style={styles.benefitsRow}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💰</Text>
            <Text style={styles.benefitLabel}>Keep Earning</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📊</Text>
            <Text style={styles.benefitLabel}>Get Insights</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🎁</Text>
            <Text style={styles.benefitLabel}>Win Rewards</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Claim My Coins 🎉"
            onPress={() => router.push('/auth/signup')}
            variant="secondary"
            style={styles.primaryButton}
          />

          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => router.push('/auth/login')}>
              Sign in
            </Text>
          </Text>
        </View>

        {/* Trust Badge */}
        <View style={styles.trustBadge}>
          <Text style={styles.trustText}>🔒 No spam • Quick signup • Your data stays anonymous</Text>
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.gray[600],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
  },
  coinsCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 4,
    borderColor: colors.flickGold,
    borderBottomWidth: 8,
    borderBottomColor: colors.flickGoldDark,
    ...shadows.xl,
    shadowColor: colors.flickGold,
  },
  coinsPretext: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    width: '100%',
  },
  coinsAmount: {
    ...typography.display,
    fontSize: 72,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: -3,
    lineHeight: 80,
    textShadowColor: colors.flickGold,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
    includeFontPadding: false,
  },
  coinsIcon: {
    fontSize: 56,
    lineHeight: 64,
    includeFontPadding: false,
  },
  coinsLabel: {
    ...typography.headline,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    fontSize: 34,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: spacing.sm,
    fontWeight: '500',
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  benefitItem: {
    alignItems: 'center',
    flex: 1,
  },
  benefitIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  benefitLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '700',
  },
  actionsContainer: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    shadowColor: colors.flickGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  loginLink: {
    color: colors.flickTeal,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  trustBadge: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  trustText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});


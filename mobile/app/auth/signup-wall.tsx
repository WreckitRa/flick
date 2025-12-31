import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getGuestCoinsEarned } from '@/lib/guest';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

export default function SignupWallPage() {
  const router = useRouter();
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    const loadCoins = async () => {
      const coins = await getGuestCoinsEarned();
      setCoinsEarned(coins);
      setIsLoading(false);

      // Pulse animation for coins
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    loadCoins();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Coins Display */}
        <View style={styles.coinsContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.coinsEmoji}>🪙</Text>
          </Animated.View>
          <Text style={styles.coinsAmount}>{coinsEarned}</Text>
          <Text style={styles.coinsLabel}>Flick Coins</Text>
        </View>

        {/* Main Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Don't lose your Flick Coins 👀</Text>
          <Text style={styles.subtitle}>
            Save your rewards and unlock personalized insights.
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>💾</Text>
            <Text style={styles.benefitText}>Save your {coinsEarned} coins</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>📊</Text>
            <Text style={styles.benefitText}>See personalized insights</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>🎯</Text>
            <Text style={styles.benefitText}>Earn more coins daily</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>🎁</Text>
            <Text style={styles.benefitText}>Redeem for rewards</Text>
          </View>
        </View>

        {/* Trust Microcopy */}
        <View style={styles.trustBox}>
          <Text style={styles.trustText}>🔒 No spam. No long surveys. Your data stays anonymous.</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={styles.primaryButtonText}>Create free account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.gray[600],
    textAlign: 'center',
  },
  coinsContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  coinsEmoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  coinsAmount: {
    ...typography.largeTitle,
    color: colors.flickBlue,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  coinsLabel: {
    ...typography.body,
    color: colors.gray[600],
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  benefitsContainer: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  benefitText: {
    ...typography.body,
    color: colors.gray[900],
    flex: 1,
  },
  trustBox: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  trustText: {
    ...typography.caption,
    color: colors.gray[600],
    textAlign: 'center',
  },
  actionsContainer: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.flickYellow,
    borderRadius: borderRadius.lg,
    padding: spacing.md + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: colors.flickYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: spacing.md + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.flickBlue,
    fontWeight: '500',
  },
});


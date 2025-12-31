import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { getGuestCoinsEarned, hasCompletedGuestSurvey, clearGuestData } from '@/lib/guest';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

export default function RewardConfirmationScreen() {
  const router = useRouter();
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [hasGuestData, setHasGuestData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const coinAnimation = new Animated.Value(1);

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

        // Animate coin
        Animated.sequence([
          Animated.timing(coinAnimation, {
            toValue: 1.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(coinAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking guest data:', error);
        // On error, redirect to home
        router.replace('/(tabs)');
      }
    };

    checkGuestData();
  }, [router]);

  const handleContinue = async () => {
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.flickBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ transform: [{ scale: coinAnimation }] }}>
          <Text style={styles.emoji}>🎉</Text>
        </Animated.View>
        <Text style={styles.title}>Your Flick Coins are now saved</Text>

        {hasGuestData && coinsEarned > 0 && (
          <View style={styles.coinsContainer}>
            <Text style={styles.coinsLabel}>You have</Text>
            <Text style={styles.coinsText}>
              <Text style={styles.coinsHighlight}>🪙 {coinsEarned} Flick Coins</Text>
            </Text>
            <Text style={styles.coinsSubtext}>All saved to your account</Text>
          </View>
        )}

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            {hasGuestData
              ? 'Your guest survey answers and coins have been transferred to your account. Start earning more!'
              : 'Welcome! Start answering surveys to earn Flick Coins.'}
          </Text>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Home</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.largeTitle,
    color: colors.flickBlue,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  coinsContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  coinsLabel: {
    ...typography.body,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  coinsText: {
    ...typography.largeTitle,
    color: colors.flickBlue,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  coinsHighlight: {
    color: colors.flickBlue,
  },
  coinsSubtext: {
    ...typography.caption,
    color: colors.gray[600],
  },
  messageBox: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    maxWidth: 350,
  },
  messageText: {
    ...typography.body,
    color: colors.gray[700],
    textAlign: 'center',
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: colors.flickYellow,
    borderRadius: borderRadius.lg,
    padding: spacing.md + spacing.sm,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: colors.flickYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
  },
});


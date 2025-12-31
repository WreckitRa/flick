import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { hasCompletedOnboarding } from '@/components/Onboarding';
import { isAuthenticated, hasBeenAuthenticated } from '@/lib/auth';
import { DevMenu } from '@/components/DevMenu';
import { colors, spacing } from '@/lib/tokens';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const { data: health } = api.health.useQuery();

  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);
      
      // Check if user is currently authenticated
      const authenticated = await isAuthenticated();
      if (authenticated) {
        // User is logged in, go to home
        router.replace('/(tabs)');
        return;
      }

      // User is not authenticated - determine flow
      const hasBeenAuth = await hasBeenAuthenticated();
      const completed = await hasCompletedOnboarding();
      
      if (hasBeenAuth) {
        // Returning user (previously logged in, now logged out)
        // They've already logged in before, so don't show guest survey
        // Show signup wall or login options
        router.replace('/auth/login');
        return;
      }

      // New user - check onboarding status
      if (!completed) {
        // First time user - show onboarding
        router.replace('/onboarding');
        return;
      }

      // Onboarding completed, check if user chose to skip guest survey (by clicking login)
      const { shouldSkipGuestSurvey } = await import('@/lib/auth');
      const skipGuest = await shouldSkipGuestSurvey();
      
      if (skipGuest) {
        // User chose to log in, go to login screen
        router.replace('/auth/login');
        return;
      }
      
      // Check guest survey
      const { hasCompletedGuestSurvey } = await import('@/lib/guest');
      const guestCompleted = await hasCompletedGuestSurvey();
      
      if (!guestCompleted) {
        // Show guest survey (new user flow)
        router.replace('/guest-survey');
        return;
      }
      
      // Guest survey completed, show signup wall
      router.replace('/auth/signup-wall');
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.flickBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DevMenu />
      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.title}>Flick App is Running</Text>
      <Text style={styles.subtitle}>Everything is set up and ready to build!</Text>
      {health && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            Backend: <Text style={styles.statusValue}>{health.status}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statusBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  statusText: {
    fontSize: 14,
    color: '#0369a1',
  },
  statusValue: {
    fontWeight: 'bold',
  },
});

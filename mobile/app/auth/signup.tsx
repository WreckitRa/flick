import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';
import { setAuthToken } from '@/lib/auth';
import { getGuestUserId, clearGuestData, setGuestCoinsEarned } from '@/lib/guest';
import { ScreenContainer, Button } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const signupMutation = api.auth.signup.useMutation({
    onSuccess: async (data) => {
      try {
        console.log('[Signup] Success, storing token...');
        // Store token
        if (data.token) {
          await setAuthToken(data.token);
        }
        
        // Transfer guest survey data to user account if exists
        // The backend will handle the transfer automatically if guestUserId is provided
        // Don't clear local guest data yet - reward confirmation screen needs it
        // It will be cleared after showing the confirmation
        
        setIsLoading(false);
        console.log('[Signup] Guest data transferred:', data.hasGuestData, 'Coins:', data.guestCoinsTransferred);
        
        // Only show reward confirmation if user completed guest survey before signing up
        if (data.hasGuestData && data.guestCoinsTransferred) {
          // Update local coins for reward confirmation screen
          await setGuestCoinsEarned(data.guestCoinsTransferred);
          // Show reward confirmation screen
          router.replace('/auth/reward-confirmation');
        } else {
          // No guest data - user signed up without completing guest survey
          // Clear any guest data and go directly to home
          try {
            await clearGuestData();
          } catch (error) {
            console.error('Error clearing guest data:', error);
          }
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('[Signup] Error in onSuccess:', error);
        setIsLoading(false);
        Alert.alert('Error', 'Failed to complete signup. Please try again.');
      }
    },
    onError: (error) => {
      console.error('[Signup] Mutation error:', error);
      setIsLoading(false);
      Alert.alert('Signup Failed', error.message || 'Something went wrong. Please try again.');
    },
  });

  const handleSignup = async () => {
    // Validation
    if (authMethod === 'email' && !email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    if (authMethod === 'phone' && !phone.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('[Signup] Starting signup process...');
      // Get guest user ID if exists (to transfer guest data)
      const guestUserId = await getGuestUserId();
      console.log('[Signup] Guest user ID:', guestUserId || 'none');
      
      console.log('[Signup] Calling signup mutation...');
      signupMutation.mutate({
        email: authMethod === 'email' ? email.trim() : undefined,
        phone: authMethod === 'phone' ? phone.trim() : undefined,
        password,
        guestUserId: guestUserId || undefined,
      });
    } catch (error) {
      console.error('[Signup] Error during signup setup:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <ScreenContainer style={styles.screenContainer}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Join Flick</Text>
          <Text style={styles.subtitle}>
            Share your voice, earn rewards. Quick & free signup.
          </Text>
        </Animated.View>

        {/* Trust Microcopy */}
        <Animated.View
          style={[
            styles.trustBox,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.trustText}>🔒  No spam • Private • Anonymous</Text>
        </Animated.View>

        {/* Auth Method Toggle */}
        <Animated.View
          style={[
            styles.toggleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.toggleButton, authMethod === 'email' && styles.toggleButtonActive]}
            onPress={() => {
              triggerHaptic('light').catch(() => {});
              setAuthMethod('email');
            }}
          >
            <Text
              style={[styles.toggleText, authMethod === 'email' && styles.toggleTextActive]}
            >
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, authMethod === 'phone' && styles.toggleButtonActive]}
            onPress={() => {
              triggerHaptic('light').catch(() => {});
              setAuthMethod('phone');
            }}
          >
            <Text
              style={[styles.toggleText, authMethod === 'phone' && styles.toggleTextActive]}
            >
              Phone
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Form */}
        <View style={styles.form}>
          {authMethod === 'email' ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.gray[600]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1234567890"
                placeholderTextColor={colors.gray[600]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimum 8 characters"
              placeholderTextColor={colors.gray[500]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {password.length > 0 && password.length < 8 && (
              <Text style={styles.hint}>
                {8 - password.length} more character{8 - password.length !== 1 ? 's' : ''} needed
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.gray[600]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <Button
            title="Create My Account"
            onPress={handleSignup}
            disabled={isLoading}
            loading={isLoading}
            style={styles.button}
            variant="secondary"
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/auth/login')}
            disabled={isLoading}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  title: {
    ...typography.largeTitle,
    fontSize: 28,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
    fontWeight: '500',
  },
  trustBox: {
    backgroundColor: colors.gray[50],
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignSelf: 'center',
  },
  trustText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  toggleButtonActive: {
    backgroundColor: colors.flickGold,
    shadowColor: colors.flickGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: colors.flickGoldDark,
    borderBottomWidth: 3,
  },
  toggleText: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  toggleTextActive: {
    color: colors.text.primary,
    fontWeight: '800',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '600',
    marginBottom: spacing.xs,
    letterSpacing: 0,
  },
  input: {
    ...typography.body,
    fontSize: 16,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    color: colors.gray[900],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderBottomWidth: 3,
    borderBottomColor: colors.gray[300],
    minHeight: 50,
  },
  button: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  loginLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  loginLinkText: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[600],
    fontWeight: '600',
    textAlign: 'center',
  },
  loginLinkBold: {
    color: colors.flickTeal,
    fontWeight: '800',
  },
  hint: {
    ...typography.caption,
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
    fontWeight: '500',
  },
});


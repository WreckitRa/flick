import { useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';
import { setAuthToken } from '@/lib/auth';
import { getGuestUserId, clearGuestData } from '@/lib/guest';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

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
          const { setGuestCoinsEarned } = await import('@/lib/guest');
          await setGuestCoinsEarned(data.guestCoinsTransferred);
          // Show reward confirmation screen
          router.replace('/auth/reward-confirmation');
        } else {
          // No guest data - user signed up without completing guest survey
          // Clear any guest data and go directly to home
          try {
            const { clearGuestData } = await import('@/lib/guest');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🎯</Text>
          <Text style={styles.title}>Your voice matters</Text>
          <Text style={styles.subtitle}>
            Join thousands sharing insights that shape tomorrow. Start earning coins in seconds.
          </Text>
        </View>

        {/* Trust Microcopy */}
        <View style={styles.trustBox}>
          <Text style={styles.trustText}>🔒 No spam. No long surveys. Your data stays anonymous.</Text>
        </View>

        {/* Auth Method Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, authMethod === 'email' && styles.toggleButtonActive]}
            onPress={() => setAuthMethod('email')}
          >
            <Text
              style={[styles.toggleText, authMethod === 'email' && styles.toggleTextActive]}
            >
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, authMethod === 'phone' && styles.toggleButtonActive]}
            onPress={() => setAuthMethod('phone')}
          >
            <Text
              style={[styles.toggleText, authMethod === 'phone' && styles.toggleTextActive]}
            >
              Phone
            </Text>
          </TouchableOpacity>
        </View>

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
              placeholder="At least 8 characters"
              placeholderTextColor={colors.gray[600]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
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

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

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
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.largeTitle,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 24,
  },
  trustBox: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  trustText: {
    ...typography.caption,
    color: colors.gray[600],
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    ...typography.body,
    color: colors.gray[600],
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.flickBlue,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.gray[900],
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  button: {
    backgroundColor: colors.flickBlue,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  loginLinkText: {
    ...typography.body,
    color: colors.gray[600],
  },
  loginLinkBold: {
    color: colors.flickBlue,
    fontWeight: '600',
  },
});


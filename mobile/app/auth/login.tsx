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
import { ScreenContainer, Button } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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

  const loginMutation = api.auth.login.useMutation({
    onSuccess: async (data) => {
      // Store token
      if (data.token) {
        await setAuthToken(data.token);
      }
      setIsLoading(false);
      
      // Login should go directly to home - no reward confirmation
      // Reward confirmation is only for users who completed guest survey and signed up
      router.replace('/(tabs)');
    },
    onError: (error) => {
      setIsLoading(false);
      Alert.alert('Login Failed', error.message || 'Invalid credentials. Please try again.');
    },
  });

  const handleLogin = async () => {
    // Validation
    if (authMethod === 'email' && !email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    if (authMethod === 'phone' && !phone.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      return;
    }

    if (!password) {
      Alert.alert('Validation Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    loginMutation.mutate({
      email: authMethod === 'email' ? email.trim() : undefined,
      phone: authMethod === 'phone' ? phone.trim() : undefined,
      password,
    });
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
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue earning rewards</Text>
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
              placeholder="Enter your password"
              placeholderTextColor={colors.gray[600]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            disabled={isLoading}
            loading={isLoading}
            style={styles.button}
            variant="primary"
          />

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.push('/auth/signup')}
            disabled={isLoading}
          >
            <Text style={styles.signupLinkText}>
              Don't have an account? <Text style={styles.signupLinkBold}>Sign up</Text>
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
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  emoji: {
    fontSize: 52,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  title: {
    ...typography.largeTitle,
    fontSize: 32,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: 4,
    marginBottom: spacing.xl,
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
    backgroundColor: colors.flickTeal,
    shadowColor: colors.flickTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: colors.flickTealDark,
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
    color: colors.white,
    fontWeight: '800',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.gray[900],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderBottomWidth: 3,
    borderBottomColor: colors.gray[300],
    minHeight: 52,
  },
  button: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  signupLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  signupLinkText: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[600],
    fontWeight: '600',
    textAlign: 'center',
  },
  signupLinkBold: {
    color: colors.flickTeal,
    fontWeight: '800',
  },
});


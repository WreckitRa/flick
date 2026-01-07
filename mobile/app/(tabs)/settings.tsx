import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { removeAuthToken, resetApp } from '@/lib/auth';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';
import { ScreenContainer, Button, CoinPill, StreakBadge, LevelBadge, SuccessModal } from '@/components/ui';
import { StatCard } from '@/components/ui/StatCard';
import { AchievementBadge } from '@/components/ui/AchievementBadge';
import { triggerHaptic } from '@/lib/haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalCoins, setSuccessModalCoins] = useState(0);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    gender: '' as 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | '',
    ageBucket: '' as '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | '',
  });

  const { data: user, isLoading, refetch: refetchUser } = api.auth.getCurrentUser.useQuery();
  const { data: surveys } = api.survey.listSurveysForUser.useQuery();
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Calculate stats
  const totalSurveys = surveys?.length || 0;
  const completedSurveys = surveys?.filter(s => s.hasAnswered).length || 0;
  const totalCoins = user?.profile?.totalCoins || 0;
  const userLevel = Math.floor(totalCoins / 100) + 1;
  const memberSince = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '-';

  // Calculate time until streak expires and update every minute
  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (
        user?.profile?.currentStreak &&
        user.profile.currentStreak > 0 &&
        user.profile.lastDailySurveyDate
      ) {
        const lastSurveyDate = new Date(user.profile.lastDailySurveyDate);
        const now = new Date();
        const hoursSinceLastSurvey = (now.getTime() - lastSurveyDate.getTime()) / (1000 * 60 * 60);
        const hoursRemaining = 24 - hoursSinceLastSurvey;
        setTimeUntilExpiry(hoursRemaining > 0 ? hoursRemaining : 0);
      } else {
        setTimeUntilExpiry(null);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user?.profile?.currentStreak, user?.profile?.lastDailySurveyDate]);
  
  const updateProfileMutation = api.auth.updateProfile.useMutation({
    onSuccess: (data) => {
      refetchUser();
      setShowProfileModal(false);
      if (data.isFirstCompletion && data.pointsAwarded > 0) {
        // Show success modal for first-time profile completion
        setSuccessModalCoins(data.pointsAwarded);
        setShowSuccessModal(true);
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    },
  });

  const deleteAccountMutation = api.auth.deleteAccount.useMutation({
    onSuccess: async () => {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword('');
      
      // Clear all local data
      await resetApp();
      
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted. We\'re sorry to see you go.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/');
            },
          },
        ]
      );
    },
    onError: (error) => {
      setIsDeleting(false);
      Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAuthToken();
              router.replace('/');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm account deletion.');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data, including surveys, answers, and coins, will be permanently deleted. Are you absolutely sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setShowDeleteModal(false);
            setDeletePassword('');
          },
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            setIsDeleting(true);
            deleteAccountMutation.mutate({ password: deletePassword });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>✨</Text>
          <ActivityIndicator size="large" color={colors.flickTeal} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Simplified quick stats
  const quickStats = [
    { label: 'Coins', value: totalCoins, icon: '🪙', color: colors.flickGold },
    { label: 'Level', value: userLevel, icon: '⭐', color: colors.flickPurple },
    { label: 'Streak', value: user?.profile?.currentStreak || 0, icon: '🔥', color: '#FF6B35' },
  ];

  return (
    <ScreenContainer padding={false}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Profile Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => {
                triggerHaptic('light').catch(() => {});
                setProfileForm({
                  displayName: user?.displayName || '',
                  gender: (user?.profile?.gender as any) || '',
                  ageBucket: (user?.profile?.ageBucket as any) || '',
                });
                setShowProfileModal(true);
              }}
            >
              <Text style={styles.editAvatarButtonText}>✏️</Text>
            </TouchableOpacity>
          </View>

          {/* User Name */}
          <Text style={styles.userName}>
            {user?.displayName || 'Set your name'}
          </Text>
          <Text style={styles.userSubtitle}>
            Level {String(userLevel || 1)} • Member since {memberSince}
          </Text>

          {/* Quick Stats */}
          <View style={styles.quickStatsContainer}>
            {quickStats.map((stat, index) => (
              <View key={stat.label} style={styles.quickStat}>
                <Text style={styles.quickStatEmoji}>{stat.icon}</Text>
                <Text style={styles.quickStatValue}>{String(stat.value || 0)}</Text>
                <Text style={styles.quickStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.contentSection,
            {
              opacity: contentFade,
            },
          ]}
        >
          {/* Profile Completion Prompt */}
          {!user?.profile?.profileCompletionRewardGiven && (
            <TouchableOpacity
              style={styles.completionPrompt}
              onPress={() => {
                triggerHaptic('medium').catch(() => {});
                setProfileForm({
                  displayName: user?.displayName || '',
                  gender: (user?.profile?.gender as any) || '',
                  ageBucket: (user?.profile?.ageBucket as any) || '',
                });
                setShowProfileModal(true);
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.completionPromptEmoji}>🎁</Text>
              <View style={styles.completionPromptContent}>
                <Text style={styles.completionPromptTitle}>Complete Your Profile</Text>
                <Text style={styles.completionPromptText}>
                  Get 20 bonus coins instantly!
                </Text>
              </View>
              <View style={styles.completionPromptArrow}>
                <Text style={styles.completionPromptArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                triggerHaptic('light').catch(() => {});
                setProfileForm({
                  displayName: user?.displayName || '',
                  gender: (user?.profile?.gender as any) || '',
                  ageBucket: (user?.profile?.ageBucket as any) || '',
                });
                setShowProfileModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>👤</Text>
                <View>
                  <Text style={styles.menuItemTitle}>Edit Profile</Text>
                  <Text style={styles.menuItemSubtitle}>Name, age, gender</Text>
                </View>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            {user?.email && (
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuItemIcon}>📧</Text>
                  <View>
                    <Text style={styles.menuItemTitle}>Email</Text>
                    <Text style={styles.menuItemSubtitle}>{user.email}</Text>
                  </View>
                </View>
              </View>
            )}

            {user?.phone && (
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuItemIcon}>📱</Text>
                  <View>
                    <Text style={styles.menuItemTitle}>Phone</Text>
                    <Text style={styles.menuItemSubtitle}>{user.phone}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
            setDeletePassword('');
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
            <Text style={styles.modalDescription}>
              To permanently delete your account, please enter your password. This action cannot be undone.
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isDeleting}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  if (!isDeleting) {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }
                }}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={confirmDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.modalButtonTextDelete}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !updateProfileMutation.isPending && setShowProfileModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => !updateProfileMutation.isPending && setShowProfileModal(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.profileModalContent}>
                {/* Header */}
                <View style={styles.profileModalHeader}>
                  <View style={styles.profileModalIconContainer}>
                    <Text style={styles.profileModalIcon}>✨</Text>
                  </View>
                  <Text style={styles.profileModalTitle}>Your Profile</Text>
                  <Text style={styles.profileModalSubtitle}>
                    {!user?.profile?.profileCompletionRewardGiven 
                      ? 'Complete to earn 20 bonus coins! 🪙' 
                      : 'Update your information anytime'}
                  </Text>
                </View>

                {/* Form Fields */}
                <View style={styles.profileFormContainer}>
                  {/* Name Input */}
                  <View style={styles.profileFormField}>
                    <Text style={styles.profileFieldLabel}>👤 Your Name</Text>
                    <TextInput
                      style={styles.profileTextInput}
                      placeholder="e.g. John Doe"
                      placeholderTextColor={colors.gray[400]}
                      value={profileForm.displayName}
                      onChangeText={(text) => setProfileForm({ ...profileForm, displayName: text })}
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!updateProfileMutation.isPending}
                    />
                  </View>

                  {/* Gender Selector */}
                  <View style={styles.profileFormField}>
                    <Text style={styles.profileFieldLabel}>⚧️ Gender</Text>
                    <TouchableOpacity
                      style={styles.profilePickerButton}
                      onPress={() => {
                        triggerHaptic('light').catch(() => {});
                        Alert.alert(
                          'Select Gender',
                          '',
                          [
                            { text: 'Male', onPress: () => setProfileForm({ ...profileForm, gender: 'MALE' }) },
                            { text: 'Female', onPress: () => setProfileForm({ ...profileForm, gender: 'FEMALE' }) },
                            { text: 'Other', onPress: () => setProfileForm({ ...profileForm, gender: 'OTHER' }) },
                            { text: 'Prefer not to say', onPress: () => setProfileForm({ ...profileForm, gender: 'PREFER_NOT_TO_SAY' }) },
                            { text: 'Cancel', style: 'cancel' },
                          ],
                          { cancelable: true }
                        );
                      }}
                      disabled={updateProfileMutation.isPending}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.profilePickerText,
                        !profileForm.gender && styles.profilePickerPlaceholder
                      ]}>
                        {profileForm.gender 
                          ? (profileForm.gender === 'MALE' ? 'Male' : 
                             profileForm.gender === 'FEMALE' ? 'Female' : 
                             profileForm.gender === 'OTHER' ? 'Other' : 
                             'Prefer not to say')
                          : 'Select your gender'}
                      </Text>
                      <Text style={styles.profilePickerIcon}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Age Group Selector */}
                  <View style={styles.profileFormField}>
                    <Text style={styles.profileFieldLabel}>🎂 Age Group</Text>
                    <TouchableOpacity
                      style={styles.profilePickerButton}
                      onPress={() => {
                        triggerHaptic('light').catch(() => {});
                        Alert.alert(
                          'Select Age Group',
                          '',
                          [
                            { text: '18-24', onPress: () => setProfileForm({ ...profileForm, ageBucket: '18-24' }) },
                            { text: '25-34', onPress: () => setProfileForm({ ...profileForm, ageBucket: '25-34' }) },
                            { text: '35-44', onPress: () => setProfileForm({ ...profileForm, ageBucket: '35-44' }) },
                            { text: '45-54', onPress: () => setProfileForm({ ...profileForm, ageBucket: '45-54' }) },
                            { text: '55-64', onPress: () => setProfileForm({ ...profileForm, ageBucket: '55-64' }) },
                            { text: '65+', onPress: () => setProfileForm({ ...profileForm, ageBucket: '65+' }) },
                            { text: 'Cancel', style: 'cancel' },
                          ],
                          { cancelable: true }
                        );
                      }}
                      disabled={updateProfileMutation.isPending}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.profilePickerText,
                        !profileForm.ageBucket && styles.profilePickerPlaceholder
                      ]}>
                        {profileForm.ageBucket || 'Select your age group'}
                      </Text>
                      <Text style={styles.profilePickerIcon}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.profileModalActions}>
                  <TouchableOpacity
                    style={styles.profileSaveButton}
                    onPress={() => {
                      if (!profileForm.displayName.trim()) {
                        Alert.alert('Name Required', 'Please enter your name to continue.');
                        triggerHaptic('warning').catch(() => {});
                        return;
                      }
                      if (!profileForm.gender) {
                        Alert.alert('Gender Required', 'Please select your gender.');
                        triggerHaptic('warning').catch(() => {});
                        return;
                      }
                      if (!profileForm.ageBucket) {
                        Alert.alert('Age Required', 'Please select your age group.');
                        triggerHaptic('warning').catch(() => {});
                        return;
                      }
                      triggerHaptic('success').catch(() => {});
                      updateProfileMutation.mutate({
                        displayName: profileForm.displayName.trim(),
                        gender: profileForm.gender,
                        ageBucket: profileForm.ageBucket,
                      });
                    }}
                    disabled={updateProfileMutation.isPending}
                    activeOpacity={0.9}
                  >
                    {updateProfileMutation.isPending ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.profileSaveButtonText}>
                        {!user?.profile?.profileCompletionRewardGiven ? 'Save & Claim Coins 🎉' : 'Save Changes'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.profileCancelButton}
                    onPress={() => setShowProfileModal(false)}
                    disabled={updateProfileMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.profileCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Success Modal for Profile Completion */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Amazing! You're All Set!"
        emoji="✨"
        coins={successModalCoins}
        message="Your profile is complete. Keep sharing your insights!"
        autoDismiss={true}
        autoDismissDelay={3000}
      />
    </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    paddingBottom: spacing.xxl + spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.gray[50],
  },
  loadingEmoji: {
    fontSize: 64,
    textAlign: 'center',
  },
  loadingText: {
    ...typography.body,
    fontSize: 17,
    color: colors.gray[700],
    fontWeight: '600',
  },
  heroSection: {
    backgroundColor: colors.white,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.flickTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.flickTeal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background.elevated,
    shadowColor: colors.flickTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarEmoji: {
    fontSize: 48,
    color: colors.text.inverse,
    fontWeight: '900',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.flickGold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.elevated,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editAvatarButtonText: {
    fontSize: 16,
  },
  userName: {
    ...typography.largeTitle,
    fontSize: 24,
    color: colors.gray[900],
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  userSubtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '600',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  quickStat: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderBottomWidth: 3,
  },
  quickStatEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  quickStatValue: {
    ...typography.title,
    fontSize: 24,
    color: colors.gray[900],
    fontWeight: '900',
    marginBottom: 2,
  },
  quickStatLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentSection: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  completionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.flickGold,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: colors.flickGoldDark,
    borderBottomWidth: 5,
    shadowColor: colors.flickGold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    gap: spacing.sm,
  },
  completionPromptEmoji: {
    fontSize: 36,
  },
  completionPromptContent: {
    flex: 1,
  },
  completionPromptTitle: {
    ...typography.body,
    fontSize: 17,
    color: colors.black,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  completionPromptText: {
    ...typography.caption,
    fontSize: 14,
    color: colors.gray[800],
    fontWeight: '600',
  },
  completionPromptArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionPromptArrowText: {
    fontSize: 20,
    color: colors.black,
    fontWeight: '800',
  },
  sectionTitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderBottomWidth: 4,
    minHeight: 72,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuItemIcon: {
    fontSize: 32,
  },
  menuItemTitle: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[900],
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  menuItemSubtitle: {
    ...typography.caption,
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  },
  menuItemArrow: {
    ...typography.largeTitle,
    fontSize: 28,
    color: colors.gray[400],
    fontWeight: '300',
  },
  achievementCountBadge: {
    backgroundColor: colors.flickPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 3,
    borderColor: colors.flickPurpleLight,
    minWidth: 60,
    alignItems: 'center',
    shadowColor: colors.flickPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementCountText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  rewardBadge: {
    backgroundColor: colors.flickGold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.flickGoldDark,
    shadowColor: colors.flickGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardBadgeText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '800',
    color: colors.black,
  },
  achievementsGrid: {
    gap: spacing.sm,
  },
  streakCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 3,
    borderColor: '#FF6B35',
    borderBottomWidth: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  streakEmojiContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  streakEmoji: {
    fontSize: 40,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    ...typography.largeTitle,
    fontSize: 48,
    fontWeight: '900',
    color: '#FF6B35',
    letterSpacing: -2,
    marginBottom: spacing.xs,
  },
  streakLabel: {
    ...typography.body,
    fontSize: 18,
    color: colors.gray[700],
    fontWeight: '600',
  },
  streakBestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.gray[100],
  },
  streakBestLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[600],
    fontWeight: '500',
  },
  streakBest: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[900],
    fontWeight: '700',
  },
  streakWarning: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    borderWidth: 3,
    borderColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakWarningIcon: {
    fontSize: 24,
  },
  streakWarningText: {
    ...typography.body,
    fontSize: 15,
    color: '#92400E',
    fontWeight: '700',
    flex: 1,
  },
  streakEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  streakEmptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  streakEmptyTitle: {
    ...typography.title,
    fontSize: 22,
    color: colors.gray[900],
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  streakEmptyText: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  profilePromptCard: {
    backgroundColor: colors.flickGold,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.flickGoldDark,
    borderBottomWidth: 6,
    shadowColor: colors.flickGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  profilePromptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    width: '100%',
  },
  profilePromptEmoji: {
    fontSize: 48,
  },
  profilePromptTitle: {
    ...typography.title,
    fontSize: 24,
    color: colors.black,
    marginBottom: spacing.sm,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profilePromptText: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[800],
    marginBottom: spacing.lg,
    lineHeight: 24,
    fontWeight: '500',
  },
  profilePromptButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.black,
    borderBottomWidth: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePromptButtonText: {
    ...typography.body,
    fontSize: 17,
    color: colors.black,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  profileLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[600],
    fontWeight: '500',
  },
  profileValue: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[900],
    fontWeight: '600',
  },
  editButton: {
    marginTop: spacing.md,
  },
  accountCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg + spacing.sm,
    borderWidth: 3,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md + spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[100],
  },
  accountLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  accountIcon: {
    fontSize: 20,
  },
  accountLabel: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: '600',
  },
  accountValue: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[900],
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderBottomWidth: 4,
    marginBottom: spacing.md,
    minHeight: 56,
    justifyContent: 'center',
  },
  logoutButtonText: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[900],
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    borderBottomWidth: 4,
    borderBottomColor: '#EF4444',
    minHeight: 56,
    justifyContent: 'center',
  },
  deleteButtonText: {
    ...typography.body,
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginHorizontal: spacing.lg,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 22,
    color: colors.gray[900],
    fontWeight: '800',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  modalDescription: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[600],
    marginBottom: spacing.xl,
    lineHeight: 22,
    fontWeight: '500',
  },
  passwordInput: {
    ...typography.body,
    fontSize: 16,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md + spacing.xs,
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    color: colors.gray[900],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md + spacing.xs,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  modalButtonCancel: {
    backgroundColor: colors.white,
    borderColor: colors.gray[300],
  },
  modalButtonDelete: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  modalButtonTextCancel: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[900],
    fontWeight: '700',
  },
  modalButtonTextDelete: {
    ...typography.body,
    fontSize: 16,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  modalButtonSave: {
    backgroundColor: colors.flickTeal,
    borderColor: colors.flickTealDark,
  },
  modalButtonTextSave: {
    ...typography.body,
    fontSize: 16,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  // Profile Modal Styles
  profileModalContent: {
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    width: '90%',
    maxWidth: 420,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  profileModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileModalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.flickTealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.flickTeal,
  },
  profileModalIcon: {
    fontSize: 32,
  },
  profileModalTitle: {
    ...typography.largeTitle,
    fontSize: 24,
    color: colors.gray[900],
    fontWeight: '900',
    marginBottom: spacing.xs,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  profileModalSubtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  profileFormContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  profileFormField: {
    gap: spacing.sm,
  },
  profileFieldLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray[900],
    fontWeight: '700',
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  profileTextInput: {
    ...typography.body,
    fontSize: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.gray[900],
    minHeight: 52,
    borderBottomWidth: 4,
  },
  profilePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 52,
    borderBottomWidth: 4,
  },
  profilePickerText: {
    ...typography.body,
    fontSize: 17,
    color: colors.gray[900],
    fontWeight: '600',
    flex: 1,
  },
  profilePickerPlaceholder: {
    color: colors.gray[400],
    fontWeight: '400',
  },
  profilePickerIcon: {
    fontSize: 12,
    color: colors.gray[500],
    marginLeft: spacing.sm,
  },
  profileModalActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  profileSaveButton: {
    backgroundColor: colors.flickTeal,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderWidth: 3,
    borderColor: colors.flickTealDark,
    borderBottomWidth: 6,
    shadowColor: colors.flickTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  profileSaveButtonText: {
    ...typography.body,
    fontSize: 17,
    color: colors.text.inverse,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileCancelButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm + spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.gray[300],
  },
  profileCancelButtonText: {
    ...typography.body,
    fontSize: 16,
    color: colors.gray[700],
    fontWeight: '700',
  },
});






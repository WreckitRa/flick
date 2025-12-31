import { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { removeAuthToken, resetApp } from '@/lib/auth';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: user, isLoading } = api.auth.getCurrentUser.useQuery();

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
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.flickBlue} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Account Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoCard}>
          {user?.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          )}
          {user?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          )}
          {user?.displayName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Display Name</Text>
              <Text style={styles.infoValue}>{user.displayName}</Text>
            </View>
          )}
          {user?.createdAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <Text style={styles.actionButtonText}>Log Out</Text>
          <Text style={styles.actionButtonIcon}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={handleDeleteAccount}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
            Delete Account
          </Text>
          <Text style={[styles.actionButtonIcon, styles.actionButtonIconDanger]}>→</Text>
        </TouchableOpacity>
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.flickBlue,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  infoLabel: {
    ...typography.body,
    color: colors.gray[600],
    fontWeight: '500',
  },
  infoValue: {
    ...typography.body,
    color: colors.gray[900],
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actionButtonDanger: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    ...typography.body,
    color: colors.gray[900],
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: '#DC2626',
  },
  actionButtonIcon: {
    ...typography.body,
    color: colors.gray[600],
    fontSize: 20,
  },
  actionButtonIconDanger: {
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.title,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  modalDescription: {
    ...typography.body,
    color: colors.gray[600],
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  passwordInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  modalButtonDelete: {
    backgroundColor: '#DC2626',
  },
  modalButtonTextCancel: {
    ...typography.body,
    color: colors.gray[900],
    fontWeight: '600',
  },
  modalButtonTextDelete: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});





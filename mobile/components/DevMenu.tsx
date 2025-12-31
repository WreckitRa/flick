import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { resetApp } from '@/lib/auth';
import { colors, spacing, borderRadius, typography } from '@/lib/tokens';

export function DevMenu() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    Alert.alert(
      'Reset App',
      'This will clear all app data and return you to onboarding. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetApp();
            setVisible(false);
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerText}>⚙️</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.menu}>
            <Text style={styles.title}>Dev Menu</Text>
            <Text style={styles.subtitle}>Development Tools</Text>

            <TouchableOpacity style={styles.button} onPress={handleReset}>
              <Text style={styles.buttonText}>🔄 Reset App</Text>
              <Text style={styles.buttonSubtext}>Clear all data & return to onboarding</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    top: spacing.xl + spacing.md,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  triggerText: {
    fontSize: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  menu: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    ...typography.title,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.gray[600],
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  buttonSubtext: {
    ...typography.caption,
    color: colors.gray[600],
  },
  closeButton: {
    backgroundColor: colors.flickBlue,
    borderColor: colors.flickBlue,
    marginTop: spacing.md,
    marginBottom: 0,
  },
  closeButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
});





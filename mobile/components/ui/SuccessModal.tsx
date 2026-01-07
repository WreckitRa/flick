import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/tokens';
import { CoinPill } from './CoinPill';
import { CoinBurst } from './CoinBurst';
import { triggerHaptic } from '@/lib/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  coins?: number;
  emoji?: string;
  message?: string;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

export function SuccessModal({
  visible,
  onClose,
  title,
  coins,
  emoji = '🎉',
  message,
  autoDismiss = false,
  autoDismissDelay = 2000,
}: SuccessModalProps) {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptic
      triggerHaptic('success').catch(() => {});

      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
      scaleAnim.setValue(0.8);
      emojiScale.setValue(0);
      contentFade.setValue(0);

      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After modal appears, animate content
        Animated.sequence([
          Animated.spring(emojiScale, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(contentFade, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Auto dismiss
      if (autoDismiss) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoDismissDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const handleClose = () => {
    triggerHaptic('light').catch(() => {});
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View
          style={[
            styles.overlayBackground,
            { opacity: fadeAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            {/* Coin burst effect for coins */}
            {coins && coins > 0 && (
              <View style={styles.burstContainer}>
                <CoinBurst amount={coins} />
              </View>
            )}

            {/* Emoji */}
            <Animated.Text
              style={[
                styles.emoji,
                { transform: [{ scale: emojiScale }] },
              ]}
            >
              {emoji}
            </Animated.Text>

            {/* Title */}
            <Animated.View style={{ opacity: contentFade }}>
              <Text style={styles.title}>{title}</Text>

              {/* Coins */}
              {coins && coins > 0 && (
                <View style={styles.coinsContainer}>
                  <CoinPill amount={coins} size="medium" animated />
                </View>
              )}

              {/* Message */}
              {message && (
                <Text style={styles.message}>{message}</Text>
              )}

              {/* Button */}
              {!autoDismiss && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Nice! 👍</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.text.primary,
    opacity: 0.5,
  },
  modalContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.flickTeal,
    borderBottomWidth: 6,
    ...shadows.xl,
  },
  burstContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 72,
  },
  title: {
    ...typography.largeTitle,
    fontSize: 26,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '900',
    marginBottom: spacing.lg,
    letterSpacing: -0.8,
  },
  coinsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  message: {
    ...typography.body,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  button: {
    backgroundColor: colors.flickTeal,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xxl,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.flickTealDark,
    borderBottomWidth: 6,
    marginTop: spacing.sm,
    ...shadows.md,
  },
  buttonText: {
    ...typography.body,
    fontSize: 17,
    color: colors.text.inverse,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});


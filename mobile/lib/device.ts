import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@flick_device_id';

/**
 * Get or create a persistent device identifier.
 * Uses expo-application's installationId which persists across app reinstalls.
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Check if we already have a device ID stored
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // Get installation ID from expo-application (persists across reinstalls)
    let deviceId: string | null = null;
    
    try {
      // Installation ID persists across app reinstalls on the same device
      // Use the correct method from expo-application
      if (typeof Application.getInstallationIdAsync === 'function') {
        deviceId = await Application.getInstallationIdAsync();
      } else if (Application.default && typeof Application.default.getInstallationIdAsync === 'function') {
        // Try default export if named export doesn't work
        deviceId = await Application.default.getInstallationIdAsync();
      }
    } catch (error) {
      console.warn('[Device] Failed to get installation ID:', error);
    }

    // Fallback: create a device fingerprint if installation ID is not available
    if (!deviceId) {
      // Generate a unique ID based on timestamp and random string
      // This will be stored in AsyncStorage, so it persists until app is uninstalled
      // For true cross-reinstall persistence, we'd need the installation ID
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      deviceId = `device_${timestamp}_${randomId}`;
    }

    // Store the device ID for future use
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    
    return deviceId;
  } catch (error) {
    console.error('[Device] Error getting device ID:', error);
    // Ultimate fallback: generate a random ID
    const fallbackId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, fallbackId);
    return fallbackId;
  }
}


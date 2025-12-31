import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'flick_auth_token';
const ONBOARDING_KEY = '@flick_onboarding_completed';
const HAS_BEEN_AUTHENTICATED_KEY = '@flick_has_been_authenticated';
const SKIP_GUEST_SURVEY_KEY = '@flick_skip_guest_survey';

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  // Mark that user has been authenticated (even if they log out later)
  await AsyncStorage.setItem(HAS_BEEN_AUTHENTICATED_KEY, 'true');
}

export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Token might not exist, ignore error
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return token !== null;
}

export async function hasBeenAuthenticated(): Promise<boolean> {
  const value = await AsyncStorage.getItem(HAS_BEEN_AUTHENTICATED_KEY);
  return value === 'true';
}

export async function setSkipGuestSurvey(): Promise<void> {
  await AsyncStorage.setItem(SKIP_GUEST_SURVEY_KEY, 'true');
}

export async function shouldSkipGuestSurvey(): Promise<boolean> {
  const value = await AsyncStorage.getItem(SKIP_GUEST_SURVEY_KEY);
  return value === 'true';
}

export async function resetApp(): Promise<void> {
  // Clear auth token
  await removeAuthToken();
  // Clear onboarding (local)
  await AsyncStorage.removeItem(ONBOARDING_KEY);
  // Clear has been authenticated flag (for dev reset)
  await AsyncStorage.removeItem(HAS_BEEN_AUTHENTICATED_KEY);
  // Clear skip guest survey flag
  await AsyncStorage.removeItem(SKIP_GUEST_SURVEY_KEY);
  // Clear guest survey data
  const { clearGuestData } = await import('./guest');
  await clearGuestData();
  
  // Reset device onboarding status on backend (non-blocking)
  try {
    const { getDeviceId } = await import('./device');
    const deviceId = await getDeviceId();
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Call backend to reset device onboarding status
    await fetch(`${apiUrl}/trpc/auth.resetDeviceOnboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: { deviceId },
      }),
    }).catch((error) => {
      console.error('Error resetting device onboarding on backend:', error);
      // Don't throw - allow reset to continue even if backend call fails
    });
  } catch (error) {
    console.error('Error resetting device onboarding:', error);
    // Don't throw - allow reset to continue even if backend call fails
  }
}


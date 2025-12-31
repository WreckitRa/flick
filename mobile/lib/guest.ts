import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_SURVEY_COMPLETED_KEY = '@flick_guest_survey_completed';
const GUEST_COINS_EARNED_KEY = '@flick_guest_coins_earned';
const GUEST_SURVEY_ID_KEY = '@flick_guest_survey_id';
const GUEST_ANSWERS_KEY = '@flick_guest_answers';
const GUEST_USER_ID_KEY = '@flick_guest_user_id';

export async function hasCompletedGuestSurvey(): Promise<boolean> {
  const value = await AsyncStorage.getItem(GUEST_SURVEY_COMPLETED_KEY);
  return value === 'true';
}

export async function setGuestSurveyCompleted(): Promise<void> {
  await AsyncStorage.setItem(GUEST_SURVEY_COMPLETED_KEY, 'true');
}

export async function getGuestCoinsEarned(): Promise<number> {
  const value = await AsyncStorage.getItem(GUEST_COINS_EARNED_KEY);
  return value ? parseInt(value, 10) : 0;
}

export async function setGuestCoinsEarned(coins: number): Promise<void> {
  await AsyncStorage.setItem(GUEST_COINS_EARNED_KEY, coins.toString());
}

export async function getGuestSurveyId(): Promise<string | null> {
  return await AsyncStorage.getItem(GUEST_SURVEY_ID_KEY);
}

export async function setGuestSurveyId(surveyId: string): Promise<void> {
  await AsyncStorage.setItem(GUEST_SURVEY_ID_KEY, surveyId);
}

export async function getGuestAnswers(): Promise<Record<string, string | string[]> | null> {
  const value = await AsyncStorage.getItem(GUEST_ANSWERS_KEY);
  return value ? JSON.parse(value) : null;
}

export async function setGuestAnswers(answers: Record<string, string | string[]>): Promise<void> {
  await AsyncStorage.setItem(GUEST_ANSWERS_KEY, JSON.stringify(answers));
}

export async function getGuestUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(GUEST_USER_ID_KEY);
}

export async function setGuestUserId(userId: string): Promise<void> {
  await AsyncStorage.setItem(GUEST_USER_ID_KEY, userId);
}

export async function clearGuestData(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_SURVEY_COMPLETED_KEY);
  await AsyncStorage.removeItem(GUEST_COINS_EARNED_KEY);
  await AsyncStorage.removeItem(GUEST_SURVEY_ID_KEY);
  await AsyncStorage.removeItem(GUEST_ANSWERS_KEY);
  await AsyncStorage.removeItem(GUEST_USER_ID_KEY);
}


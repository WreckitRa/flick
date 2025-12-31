import { Onboarding } from '@/components/Onboarding';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = () => {
    // After completing onboarding, show final screen with CTAs
    // The Onboarding component will handle showing the final screen
  };

  const handleSkip = () => {
    // Skip onboarding → Go directly to Guest Survey
    router.replace('/guest-survey');
  };

  const handleAnswerFirstQuestion = () => {
    // Primary CTA: "Answer your first question" → Guest Survey
    router.replace('/guest-survey');
  };

  const handleLogin = () => {
    // Navigate directly to login screen (skip flag already set in Onboarding component)
    router.replace('/auth/login');
  };

  return (
    <Onboarding
      onComplete={handleComplete}
      onSkip={handleSkip}
      onAnswerFirstQuestion={handleAnswerFirstQuestion}
      onLogin={handleLogin}
    />
  );
}


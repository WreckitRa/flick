import 'expo-router/entry';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api, createTRPCClient } from '@/lib/api';
import { DevMenu } from '@/components/DevMenu';

const queryClient = new QueryClient();
const trpcClient = createTRPCClient();

export default function RootLayout() {
  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DevMenu />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </QueryClientProvider>
    </api.Provider>
  );
}

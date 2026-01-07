import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/types/router';
import { getAuthToken } from './auth';

// Create tRPC React hooks
export const api = createTRPCReact<AppRouter>();

// Create tRPC client
// Note: We don't use superjson transformer on mobile due to React Native compatibility issues
// The backend will serialize dates as ISO strings automatically when no transformer is used
export const createTRPCClient = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  return api.createClient({
    links: [
      httpBatchLink({
        url: apiUrl,
        // No transformer - this will cause the backend to send plain JSON
        // Dates will be serialized as ISO strings by JSON.stringify
        async headers() {
          const token = await getAuthToken();
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['authorization'] = `Bearer ${token}`;
          }
          console.log('[tRPC Client] Request headers:', headers);
          return headers;
        },
        fetch: async (url, options) => {
          console.log('[tRPC Client] Fetching:', url, options?.method);
          const response = await fetch(url, options);
          console.log('[tRPC Client] Response status:', response.status);
          const text = await response.text();
          console.log('[tRPC Client] Response body (first 500 chars):', text.substring(0, 500));
          return new Response(text, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        },
      }),
    ],
  });
};

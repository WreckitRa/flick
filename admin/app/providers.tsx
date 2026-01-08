'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { httpBatchLink } from '@trpc/client';
import { getToken } from '@/lib/auth';

export function Providers({ children }: { children: React.ReactNode }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Debug logging (check browser console)
  if (typeof window !== 'undefined') {
    console.log('[Admin] API URL from env:', process.env.NEXT_PUBLIC_API_URL);
    console.log('[Admin] Using API URL:', apiUrl);
  }

  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: apiUrl,
          // No transformer - dates come as ISO strings
          headers() {
            const token = getToken();
            return {
              authorization: token ? `Bearer ${token}` : '',
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
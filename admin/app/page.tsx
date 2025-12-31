'use client';

import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { trpc } from '@/lib/trpc';
import { removeToken } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const { data: health } = trpc.health.useQuery();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md relative">
          <button
            onClick={handleLogout}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            Logout
          </button>
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Flick Admin</h1>
          <p className="text-gray-600 mb-4">Ready to build!</p>
          <div className="mt-6 space-y-2">
            <a
              href="/surveys"
              className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              Manage Surveys
            </a>
            <a
              href="/users"
              className="block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
            >
              Manage Users
            </a>
          </div>
          {health && (
            <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-green-700">
                Backend: <span className="font-semibold">{health.status}</span>
              </p>
              <p className="text-xs text-green-600 mt-1">{health.message}</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { removeToken } from '@/lib/auth';
import { trpc } from '@/lib/trpc';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: health } = trpc.health.useQuery();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Surveys', href: '/surveys', icon: '📝' },
    { name: 'Users', href: '/users', icon: '👥' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-sm z-40">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-xl font-bold text-white">F</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Flick Admin</h1>
              <p className="text-xs text-slate-500">Control Center</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Status & Logout */}
          <div className="px-4 py-6 border-t border-slate-200/60 space-y-4">
            {health && (
              <div className="px-4 py-3 rounded-xl bg-emerald-50/80 border border-emerald-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-emerald-700">System Online</span>
                </div>
                <p className="text-xs text-emerald-600 mt-1">{health.message}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100/80 transition-colors"
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}



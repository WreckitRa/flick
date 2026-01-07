'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';

export default function HomePage() {
  const { data: surveys } = trpc.survey.list.useQuery({});
  const { data: users } = trpc.user.list.useQuery({ page: 1, limit: 1 });
  
  const totalSurveys = surveys?.length || 0;
  const publishedSurveys = surveys?.filter(s => s.published).length || 0;
  const totalUsers = users?.pagination.total || 0;
  const totalAnswers = surveys?.reduce((sum, s) => sum + s.answerCount, 0) || 0;

  const stats = [
    {
      name: 'Total Surveys',
      value: totalSurveys,
      change: `${publishedSurveys} published`,
      icon: '📝',
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Total Users',
      value: totalUsers,
      change: 'Registered users',
      icon: '👥',
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Total Answers',
      value: totalAnswers,
      change: 'Survey responses',
      icon: '💬',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      name: 'Published',
      value: publishedSurveys,
      change: `${totalSurveys > 0 ? Math.round((publishedSurveys / totalSurveys) * 100) : 0}% of surveys`,
      icon: '✅',
      color: 'from-amber-500 to-amber-600',
    },
  ];

  const quickActions = [
    { name: 'Create Survey', href: '/surveys/new', icon: '➕', color: 'blue' },
    { name: 'View Surveys', href: '/surveys', icon: '📋', color: 'purple' },
    { name: 'Manage Users', href: '/users', icon: '👤', color: 'emerald' },
  ];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
              <p className="text-slate-600">Welcome to Flick Admin Portal</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div
                  key={stat.name}
                  className="glass rounded-2xl p-6 card-hover animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value.toLocaleString()}</p>
                    <p className="text-sm font-medium text-slate-700 mb-1">{stat.name}</p>
                    <p className="text-xs text-slate-500">{stat.change}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <a
                    key={action.name}
                    href={action.href}
                    className={`group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-${action.color}-50 to-${action.color}-50/50 border border-${action.color}-200/60 hover:shadow-lg transition-all duration-200`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-${action.color}-500 flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <span className="font-semibold text-slate-900">{action.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Recent Activity Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Surveys</h2>
                {surveys && surveys.length > 0 ? (
                  <div className="space-y-3">
                    {surveys.slice(0, 5).map((survey) => (
                      <a
                        key={survey.id}
                        href={`/surveys/${survey.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                            {survey.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {survey.questionCount} questions • {survey.answerCount} answers
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          survey.published 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {survey.published ? 'Published' : 'Draft'}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No surveys yet</p>
                )}
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">System Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="font-medium text-slate-900">Backend API</span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">Online</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50/50 border border-blue-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-medium text-slate-900">Database</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-700">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

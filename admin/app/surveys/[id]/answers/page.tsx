'use client';

import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';

export default function SurveyAnswersPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const { data: answers, isLoading } = trpc.survey.getSurveyAnswers.useQuery({
    surveyId,
  });

  const { data: survey } = trpc.survey.get.useQuery({ id: surveyId });

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-slate-500">Loading answers...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/surveys/${surveyId}`)}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors font-medium"
              >
                <span>←</span>
                <span>Back to Survey</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Survey Answers
                </h1>
                <p className="text-slate-600 mt-1">{survey?.title || 'Survey'}</p>
              </div>
            </div>

            {!answers || answers.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No answers yet</h3>
                <p className="text-slate-600 mb-6">No one has submitted answers to this survey yet.</p>
                <button
                  onClick={() => router.push(`/surveys/${surveyId}`)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
                >
                  Back to Survey
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-1">
                        Total Submissions: {answers.length}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {answers.filter((a: { user: { email?: string } }) => a.user.email?.startsWith('guest_') && a.user.email?.endsWith('@flick.guest')).length} guest users,{' '}
                        {answers.filter((a: { user: { email?: string } }) => !(a.user.email?.startsWith('guest_') && a.user.email?.endsWith('@flick.guest'))).length} registered users
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          🪙 {answers.reduce((sum: number, a: { totalCoins: number }) => sum + a.totalCoins, 0)}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Total Coins Awarded</div>
                      </div>
                    </div>
                  </div>
                </div>

                {answers.map((userAnswer: { user: { id: string; email?: string; displayName?: string; phone?: string }; submittedAt: string; totalCoins: number; answers: any[]; [key: string]: any }, index: number) => {
                  // Identify guest users by email pattern (guest_*@flick.guest)
                  const isGuest = userAnswer.user.email?.startsWith('guest_') && userAnswer.user.email?.endsWith('@flick.guest');
                  return (
                    <div key={userAnswer.user.id} className="glass rounded-2xl p-6 card-hover">
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-slate-900">
                              {isGuest ? '👤 Guest User' : userAnswer.user.displayName || userAnswer.user.email || userAnswer.user.phone}
                            </h3>
                            {isGuest && (
                              <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 rounded-full border border-amber-200/60">
                                Guest
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {userAnswer.user.email && !isGuest && userAnswer.user.email}
                            {userAnswer.user.phone && !isGuest && userAnswer.user.phone}
                            {isGuest && userAnswer.user.email}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Submitted: {new Date(userAnswer.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            🪙 {userAnswer.totalCoins}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">Total Coins</div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-5 space-y-3">
                        {userAnswer.answers.map((answer: { questionText: string; questionType: string; coinsEarned: number; answer: string | string[]; questionOptions?: any[]; [key: string]: any }, answerIndex: number) => {
                          const selectedOptions = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
                          
                          return (
                            <div key={answerIndex} className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{answer.questionText}</p>
                                  <p className="text-xs text-slate-500 mt-1 capitalize">
                                    {answer.questionType.toLowerCase().replace('_', ' ')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {answer.coinsEarned > 0 && (
                                    <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200/60">
                                      🪙 +{answer.coinsEarned} coins
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-3">
                                <p className="text-sm text-slate-700 font-semibold mb-2">Selected:</p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedOptions.map((optionId: string, idx: number) => {
                                    const option = answer.questionOptions?.find((o: { id: string; emoji?: string; text?: string; [key: string]: any }) => o.id === optionId);
                                    return (
                                      <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700"
                                      >
                                        {option?.emoji && <span className="mr-1.5">{option.emoji}</span>}
                                        {option?.text || optionId}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}


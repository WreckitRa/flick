'use client';

import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading answers...</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/surveys/${surveyId}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Survey
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Answers for: {survey?.title || 'Survey'}
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {!answers || answers.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No answers yet</h3>
              <p className="text-gray-600 mb-4">No one has submitted answers to this survey yet.</p>
              <button
                onClick={() => router.push(`/surveys/${surveyId}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Survey
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Total Submissions: {answers.length}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {answers.filter((a) => a.user.email?.startsWith('guest_') && a.user.email?.endsWith('@flick.guest')).length} guest users,{' '}
                      {answers.filter((a) => !(a.user.email?.startsWith('guest_') && a.user.email?.endsWith('@flick.guest'))).length} registered users
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        🪙 {answers.reduce((sum, a) => sum + a.totalCoins, 0)}
                      </div>
                      <div className="text-xs text-gray-500">Total Coins Awarded</div>
                    </div>
                    <button
                      onClick={() => router.push(`/surveys/${surveyId}`)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Back to Survey
                    </button>
                  </div>
                </div>
              </div>

              {answers.map((userAnswer, index) => {
                // Identify guest users by email pattern (guest_*@flick.guest)
                const isGuest = userAnswer.user.email?.startsWith('guest_') && userAnswer.user.email?.endsWith('@flick.guest');
                return (
                  <div key={userAnswer.user.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {isGuest ? '👤 Guest User' : userAnswer.user.displayName || userAnswer.user.email || userAnswer.user.phone}
                          </h3>
                          {isGuest && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Guest
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {userAnswer.user.email && !isGuest && userAnswer.user.email}
                          {userAnswer.user.phone && !isGuest && userAnswer.user.phone}
                          {isGuest && userAnswer.user.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(userAnswer.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          🪙 {userAnswer.totalCoins}
                        </div>
                        <div className="text-xs text-gray-500">Total Coins</div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 space-y-3">
                      {userAnswer.answers.map((answer, answerIndex) => {
                        const selectedOptions = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
                        
                        return (
                          <div key={answerIndex} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{answer.questionText}</p>
                                <p className="text-xs text-gray-500 mt-1 capitalize">
                                  {answer.questionType.toLowerCase().replace('_', ' ')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {answer.coinsEarned > 0 && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    🪙 +{answer.coinsEarned} coins
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <p className="text-sm text-gray-700 font-medium mb-1">Selected:</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedOptions.map((optionId, idx) => {
                                  const option = answer.questionOptions?.find((o: any) => o.id === optionId);
                                  return (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm"
                                    >
                                      {option?.emoji && <span className="mr-1">{option.emoji}</span>}
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
    </AuthGuard>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';

export default function SurveyEditorPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;
  const isNew = surveyId === 'new';

  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    type: 'DAILY' as 'GUEST' | 'DAILY',
    coinsReward: 10,
    published: false,
    isGuestSurvey: false,
    publishAt: null as string | null,
    expiryType: null as 'SPECIFIC_DATE' | 'RELATIVE_DAYS' | null,
    expiresAt: null as string | null,
    expiryDays: null as number | null,
  });

  const { data: survey, isLoading } = trpc.survey.get.useQuery(
    { id: surveyId },
    { enabled: !isNew }
  );

  const guestSurveyMutation = trpc.survey.setGuestSurvey.useMutation({
    onSuccess: (data) => {
      refetchSurvey();
      // Update state based on the mutation result
      setSurveyData((prev) => ({ ...prev, isGuestSurvey: data.isGuestSurvey }));
    },
  });

  const createMutation = trpc.survey.create.useMutation({
    onSuccess: async (data) => {
      // If type is GUEST, automatically set it as guest survey
      if (surveyData.type === 'GUEST') {
        try {
          await guestSurveyMutation.mutateAsync({
            id: data.id,
            isGuestSurvey: true,
          });
        } catch (error) {
          console.error('Error setting guest survey:', error);
        }
      }
      router.push(`/surveys/${data.id}`);
    },
  });

  const updateMutation = trpc.survey.update.useMutation({
    onSuccess: () => {
      // If type changed to GUEST, automatically set it as guest survey
      // If type changed to DAILY, automatically unset it as guest survey
      if (surveyData.type === 'GUEST' && !surveyData.isGuestSurvey) {
        guestSurveyMutation.mutate({
          id: surveyId,
          isGuestSurvey: true,
        });
      } else if (surveyData.type === 'DAILY' && surveyData.isGuestSurvey) {
        guestSurveyMutation.mutate({
          id: surveyId,
          isGuestSurvey: false,
        });
      } else {
        refetchSurvey();
      }
      alert('Survey saved!');
    },
  });

  const { refetch: refetchSurvey } = trpc.survey.get.useQuery(
    { id: surveyId },
    { enabled: !isNew }
  );

  const publishMutation = trpc.survey.publish.useMutation({
    onSuccess: () => {
      refetchSurvey();
      setSurveyData((prev) => ({ ...prev, published: !prev.published }));
    },
  });

  useEffect(() => {
    if (survey) {
      setSurveyData({
        title: survey.title,
        description: survey.description || '',
        type: survey.type,
        coinsReward: survey.coinsReward,
        published: survey.published,
        isGuestSurvey: survey.isGuestSurvey,
        publishAt: survey.publishAt || null,
        expiryType: survey.expiryType || null,
        expiresAt: survey.expiresAt || null,
        expiryDays: survey.expiryDays || null,
      });
    }
  }, [survey]);

  const handleSave = () => {
    if (isNew) {
      createMutation.mutate(surveyData);
    } else {
      updateMutation.mutate({ id: surveyId, ...surveyData });
    }
  };

  const handlePublish = (published: boolean) => {
    publishMutation.mutate({ id: surveyId, published });
  };

  const handleSetGuestSurvey = (isGuestSurvey: boolean) => {
    guestSurveyMutation.mutate({ id: surveyId, isGuestSurvey });
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-slate-500">Loading survey...</p>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/surveys')}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                >
                  <span>←</span>
                  <span>Back</span>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {isNew ? 'Create Survey' : survey?.title || 'Edit Survey'}
                  </h1>
                  {!isNew && survey && (
                    <p className="text-sm text-slate-600 mt-1">
                      {survey.questions?.length || 0} questions
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {!isNew && (
                  <>
                    <button
                      onClick={() => router.push(`/surveys/${surveyId}/answers`)}
                      className="px-4 py-2 rounded-xl font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                    >
                      View Answers
                    </button>
                    <button
                      onClick={() => handlePublish(!surveyData.published)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                        surveyData.published
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {surveyData.published ? 'Unpublish' : 'Publish'}
                    </button>
                    {surveyData.type === 'GUEST' && (
                      <button
                        onClick={() => handleSetGuestSurvey(!surveyData.isGuestSurvey)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                          surveyData.isGuestSurvey
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {surveyData.isGuestSurvey ? '⭐ Guest Survey' : 'Set as Guest Survey'}
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
                >
                  {isNew ? 'Create' : 'Save'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Survey Details */}
              <div className="lg:col-span-1">
                <div className="glass rounded-2xl p-6 sticky top-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Survey Details</h2>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={surveyData.title}
                        onChange={(e) => setSurveyData({ ...surveyData, title: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        placeholder="Enter survey title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={surveyData.description}
                        onChange={(e) =>
                          setSurveyData({ ...surveyData, description: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white resize-none"
                        placeholder="Optional description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={surveyData.type}
                        onChange={(e) => {
                          const newType = e.target.value as 'GUEST' | 'DAILY';
                          setSurveyData({
                            ...surveyData,
                            type: newType,
                            isGuestSurvey: newType === 'GUEST',
                          });
                        }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="DAILY">Daily Survey</option>
                        <option value="GUEST">Guest Survey</option>
                      </select>
                      {surveyData.type === 'GUEST' && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <span>✓</span>
                          <span>This survey will be automatically set as the guest survey</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Coins Reward 🪙
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={surveyData.coinsReward}
                        onChange={(e) =>
                          setSurveyData({
                            ...surveyData,
                            coinsReward: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Total coins awarded for completing the survey
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900 mb-3">Scheduling & Expiry</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Schedule Publish Date 📅
                          </label>
                          <input
                            type="datetime-local"
                            value={surveyData.publishAt ? surveyData.publishAt.slice(0, 16) : ''}
                            onChange={(e) =>
                              setSurveyData({
                                ...surveyData,
                                publishAt: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              })
                            }
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                          />
                          <p className="text-xs text-slate-500 mt-2">
                            Optional: Schedule when the survey becomes available
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Expiry Type ⏰
                          </label>
                          <select
                            value={surveyData.expiryType || ''}
                            onChange={(e) => {
                              const value = e.target.value as
                                | 'SPECIFIC_DATE'
                                | 'RELATIVE_DAYS'
                                | '';
                              setSurveyData({
                                ...surveyData,
                                expiryType: value || null,
                                expiresAt: value === 'SPECIFIC_DATE' ? surveyData.expiresAt : null,
                                expiryDays:
                                  value === 'RELATIVE_DAYS' ? surveyData.expiryDays : null,
                              });
                            }}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                          >
                            <option value="">No Expiry</option>
                            <option value="SPECIFIC_DATE">Specific Date/Time</option>
                            <option value="RELATIVE_DAYS">Relative Days</option>
                          </select>
                        </div>

                        {surveyData.expiryType === 'SPECIFIC_DATE' && (
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Expires At 🕐
                            </label>
                            <input
                              type="datetime-local"
                              value={surveyData.expiresAt ? surveyData.expiresAt.slice(0, 16) : ''}
                              onChange={(e) =>
                                setSurveyData({
                                  ...surveyData,
                                  expiresAt: e.target.value
                                    ? new Date(e.target.value).toISOString()
                                    : null,
                                })
                              }
                              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                              Survey will expire on this date/time
                            </p>
                          </div>
                        )}

                        {surveyData.expiryType === 'RELATIVE_DAYS' && (
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Expires After (Days) 📆
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={surveyData.expiryDays || ''}
                              onChange={(e) =>
                                setSurveyData({
                                  ...surveyData,
                                  expiryDays: e.target.value ? parseInt(e.target.value) : null,
                                })
                              }
                              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                              placeholder="e.g., 7 for 7 days"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                              Survey will expire after this many days from publish
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isNew && survey && (
                      <div className="pt-5 border-t border-slate-200">
                        <div className="text-sm text-slate-600 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">Questions:</span>
                            <span className="font-semibold text-slate-900">
                              {survey.questions.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">Status:</span>
                            {surveyData.published ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                Published
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                                Draft
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Questions */}
              <div className="lg:col-span-2">
                {isNew ? (
                  <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Save survey to add questions
                    </h3>
                    <p className="text-slate-600">
                      Create the survey first, then you can add questions and options
                    </p>
                  </div>
                ) : (
                  <QuestionsEditor surveyId={surveyId} />
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

function QuestionsEditor({ surveyId }: { surveyId: string }) {
  const { data: survey, refetch } = trpc.survey.get.useQuery({ id: surveyId });
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newlyCreatedQuestionId, setNewlyCreatedQuestionId] = useState<string | null>(null);
  const [showOptionFormForQuestion, setShowOptionFormForQuestion] = useState<string | null>(null);

  const createQuestionMutation = trpc.survey.createQuestion.useMutation({
    onSuccess: async (data) => {
      // After creating question, auto-create options for TRUE_FALSE and RATING
      if (data.type === 'TRUE_FALSE') {
        // Create True and False options
        await createOptionMutation.mutateAsync({
          questionId: data.id,
          text: 'True',
          emoji: '✅',
          order: 0,
        });
        await createOptionMutation.mutateAsync({
          questionId: data.id,
          text: 'False',
          emoji: '❌',
          order: 1,
        });
      } else if (data.type === 'RATING') {
        // Create exactly 5 rating options (1-5) with numbers only (no emoji by default)
        // Admin can add a single emoji per number as a label if desired
        for (let i = 0; i < 5; i++) {
          await createOptionMutation.mutateAsync({
            questionId: data.id,
            text: String(i + 1), // Value: 1, 2, 3, 4, 5
            emoji: '', // No emoji by default - admin can add one per number
            order: i,
          });
        }
      }

      // Refetch and then show option form
      await refetch();
      setNewlyCreatedQuestionId(data.id);
      setShowOptionFormForQuestion(data.id);
      setShowQuestionForm(false);
    },
  });

  const updateQuestionMutation = trpc.survey.updateQuestion.useMutation({
    onSuccess: () => {
      refetch();
      setEditingQuestion(null);
    },
  });

  const deleteQuestionMutation = trpc.survey.deleteQuestion.useMutation({
    onSuccess: () => refetch(),
  });

  const createOptionMutation = trpc.survey.createOption.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (!survey) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Questions</h2>
          <p className="text-sm text-slate-600 mt-1">{survey.questions.length} total questions</p>
        </div>
        <button
          onClick={() => setShowQuestionForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
        >
          <span>➕</span>
          <span>Add Question</span>
        </button>
      </div>

      {showQuestionForm && (
        <QuestionForm
          surveyId={surveyId}
          onSave={(data) => {
            createQuestionMutation.mutate(data);
          }}
          onCancel={() => setShowQuestionForm(false)}
        />
      )}

      <div className="space-y-4">
        {survey.questions.map((question: { id: string; text: string; type: string; coinsReward: number; explanation?: string | null; order: number; options?: any[]; [key: string]: any }, index: number) => (
          <div key={question.id}>
            {editingQuestion === question.id ? (
              <QuestionEditor
                question={question}
                onSave={(data) => {
                  updateQuestionMutation.mutate({ id: question.id, ...data });
                }}
                onCancel={() => setEditingQuestion(null)}
                onDelete={() => {
                  if (confirm('Delete this question?')) {
                    deleteQuestionMutation.mutate({ id: question.id });
                  }
                }}
                onRefetch={refetch}
                surveyData={survey}
              />
            ) : (
              <>
                <QuestionCard
                  question={question}
                  index={index}
                  onEdit={() => setEditingQuestion(question.id)}
                  onAddOptions={() => setShowOptionFormForQuestion(question.id)}
                  showAddOptions={(question.options?.length || 0) === 0}
                />
                {/* Show option form for newly created question or when explicitly opened */}
                {showOptionFormForQuestion === question.id && (
                  <div className="mt-4 glass rounded-xl p-6 border-2 border-blue-200/60">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-900">Add Options</h4>
                      <button
                        onClick={() => {
                          setShowOptionFormForQuestion(null);
                          setNewlyCreatedQuestionId(null);
                        }}
                        className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                      >
                        Close
                      </button>
                    </div>
                    <OptionForm
                      questionId={question.id}
                      onSave={(data) => {
                        // For RATING questions, prevent adding more than 5 options
                        if (question.type === 'RATING' && (question.options?.length || 0) >= 5) {
                          alert(
                            'Rating questions can only have 5 options (1-5). Please edit existing options instead.'
                          );
                          return;
                        }
                        createOptionMutation.mutate(data);
                      }}
                      onCancel={() => {
                        setShowOptionFormForQuestion(null);
                        setNewlyCreatedQuestionId(null);
                      }}
                      onComplete={() => {
                        setShowOptionFormForQuestion(null);
                        setNewlyCreatedQuestionId(null);
                      }}
                      questionType={question.type}
                      existingOptionsCount={question.options?.length || 0}
                    />
                    <div className="mt-4 pt-4 border-t border-slate-200 flex gap-3">
                      <button
                        onClick={() => {
                          setShowOptionFormForQuestion(null);
                          setNewlyCreatedQuestionId(null);
                          setShowQuestionForm(true);
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
                      >
                        Add Next Question
                      </button>
                      <button
                        onClick={() => {
                          setShowOptionFormForQuestion(null);
                          setNewlyCreatedQuestionId(null);
                        }}
                        className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {survey.questions.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No questions yet</h3>
          <p className="text-slate-600 mb-6">Add your first question to get started</p>
          <button
            onClick={() => setShowQuestionForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
          >
            Add Question
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  onEdit,
  onAddOptions,
  showAddOptions,
}: {
  question: any;
  index: number;
  onEdit: () => void;
  onAddOptions?: () => void;
  showAddOptions?: boolean;
}) {
  return (
    <div className="glass rounded-xl p-6 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold shadow-lg">
              {index + 1}
            </span>
            <h3 className="text-lg font-bold text-slate-900">{question.text}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600 ml-12">
            <span className="capitalize font-medium">
              {question.type.toLowerCase().replace('_', ' ')}
            </span>
            <span>•</span>
            <span>{question.options.length} options</span>
            {question.coinsReward > 0 && (
              <>
                <span>•</span>
                <span className="font-semibold text-amber-600">
                  🪙 {question.coinsReward} coins
                </span>
              </>
            )}
          </div>
          {showAddOptions && question.options.length === 0 && (
            <div className="mt-3 ml-12">
              <button
                onClick={onAddOptions}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-semibold transition-colors"
              >
                + Add Options
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-colors"
          >
            Edit
          </button>
          {onAddOptions && question.options.length > 0 && (
            <button
              onClick={onAddOptions}
              className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl font-semibold transition-colors"
            >
              + Options
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionForm({
  surveyId,
  onSave,
  onCancel,
}: {
  surveyId: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    text: '',
    type: 'SINGLE_CHOICE' as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'RATING',
    coinsReward: 0,
    explanation: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      alert('Question text is required');
      return;
    }
    onSave({
      surveyId,
      ...formData,
      order: 0, // Will be set based on position
    });
  };

  return (
    <div className="glass rounded-xl p-6 border-2 border-blue-200/60">
      <h3 className="text-lg font-bold text-slate-900 mb-5">New Question</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Question Text *</label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white resize-none"
            placeholder="Enter your question..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Question Type *</label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as any,
              })
            }
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="SINGLE_CHOICE">Single Choice</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="RATING">Rating</option>
            <option value="TRUE_FALSE">True/False</option>
          </select>
          {formData.type === 'RATING' && (
            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
              <span>ℹ️</span>
              <span>5 rating options (1-5) with emoji labels will be created automatically</span>
            </p>
          )}
          {formData.type === 'TRUE_FALSE' && (
            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
              <span>ℹ️</span>
              <span>True and False options will be created automatically</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Coins per Answer 🪙
          </label>
          <input
            type="number"
            min="0"
            value={formData.coinsReward}
            onChange={(e) =>
              setFormData({ ...formData, coinsReward: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          />
          <p className="text-xs text-slate-500 mt-2">
            Coins awarded for each answer (participation reward)
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Explanation (shown after answering)
          </label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white resize-none"
            placeholder="Optional explanation or fun fact..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
          >
            Create Question
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function QuestionEditor({
  question,
  onSave,
  onCancel,
  onDelete,
  onRefetch,
  surveyData,
}: {
  question: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  onDelete: () => void;
  onRefetch: () => void;
  surveyData?: any;
}) {
  const [formData, setFormData] = useState({
    text: question.text,
    type: question.type,
    coinsReward: question.coinsReward,
    explanation: question.explanation || '',
  });

  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [showOptionForm, setShowOptionForm] = useState(false);

  const createOptionMutation = trpc.survey.createOption.useMutation({
    onSuccess: () => {
      onRefetch();
      setShowOptionForm(false);
    },
    onError: (error) => {
      console.error('Error creating option:', error);
      alert(`Error: ${error.message}`);
    },
  });

  const updateOptionMutation = trpc.survey.updateOption.useMutation({
    onSuccess: () => {
      onRefetch();
    },
  });

  const deleteOptionMutation = trpc.survey.deleteOption.useMutation({
    onSuccess: async () => {
      // For RATING questions, renumber remaining options after deletion
      if (question.type === 'RATING') {
        // Refetch to get updated data
        await onRefetch();
        // Wait a bit for the data to be available
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Get updated question from survey data
        const updatedQuestion = surveyData?.questions?.find((q: any) => q.id === question.id);
        if (updatedQuestion && updatedQuestion.options && updatedQuestion.options.length > 0) {
          // Renumber all options to be sequential (1, 2, 3, ...)
          const sortedOptions = [...updatedQuestion.options].sort(
            (a: any, b: any) => a.order - b.order
          );
          // Update each option with new sequential values
          for (let i = 0; i < sortedOptions.length; i++) {
            await updateOptionMutation.mutateAsync({
              id: sortedOptions[i].id,
              text: String(i + 1), // New sequential value
              emoji: sortedOptions[i].emoji, // Keep existing emoji
              order: i, // New sequential order
            });
          }
          // Final refetch to show updated values
          await onRefetch();
        }
      } else {
        onRefetch();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="glass rounded-xl p-6 border-2 border-blue-200/60">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Question Text *</label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Question Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="SINGLE_CHOICE">Single Choice</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="RATING">Rating</option>
            <option value="TRUE_FALSE">True/False</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Coins per Answer 🪙
          </label>
          <input
            type="number"
            min="0"
            value={formData.coinsReward}
            onChange={(e) =>
              setFormData({ ...formData, coinsReward: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Explanation</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white resize-none"
            placeholder="Fun fact or explanation shown after answering..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
          >
            Save Question
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-5 py-2.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-semibold transition-colors"
          >
            Delete
          </button>
        </div>
      </form>

      {/* Options Section - Outside the form to prevent nested form submission */}
      <div className="border-t border-slate-200 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-slate-900">
            Options
            {question.type === 'RATING' && (
              <span className="text-sm font-normal text-slate-600 ml-2">
                ({question.options.length}/5)
              </span>
            )}
          </h4>
          <button
            type="button"
            onClick={() => {
              // For RATING questions, prevent adding more than 5 options
              if (question.type === 'RATING' && question.options.length >= 5) {
                alert(
                  'Rating questions can only have 5 options (1-5). Please edit existing options instead.'
                );
                return;
              }
              setShowOptionForm(true);
            }}
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={question.type === 'RATING' && question.options.length >= 5}
          >
            + Add Option
          </button>
        </div>

        {showOptionForm && (
          <OptionForm
            questionId={question.id}
            onSave={(data) => {
              // For RATING questions, prevent adding more than 5 options
              if (question.type === 'RATING' && question.options.length >= 5) {
                alert(
                  'Rating questions can only have 5 options (1-5). Please edit existing options instead.'
                );
                return;
              }
              createOptionMutation.mutate(data);
            }}
            onCancel={() => setShowOptionForm(false)}
            questionType={question.type}
            existingOptionsCount={question.options.length}
          />
        )}

        <div className="space-y-2">
          {question.options.map((option: any, index: number) => (
            <div key={option.id}>
              {editingOption === option.id ? (
                <OptionEditor
                  option={option}
                  questionType={question.type}
                  questionOptions={question.options}
                  onSave={(data) => {
                    // For RATING, ensure the text value matches the position (1, 2, 3, etc.)
                    if (question.type === 'RATING') {
                      const sortedOptions = [...question.options]
                        .filter((o: any) => o.id !== option.id)
                        .sort((a: any, b: any) => a.order - b.order);
                      const currentIndex = sortedOptions.findIndex(
                        (o: any) => o.order > option.order
                      );
                      const newValue =
                        currentIndex === -1 ? sortedOptions.length + 1 : currentIndex + 1;
                      data.text = String(newValue);
                      data.order = newValue - 1;
                    }
                    updateOptionMutation.mutate({ id: option.id, ...data });
                    setEditingOption(null);
                    onRefetch();
                  }}
                  onCancel={() => setEditingOption(null)}
                  onDelete={() => {
                    deleteOptionMutation.mutate({ id: option.id });
                    setEditingOption(null);
                  }}
                  onRefetch={onRefetch}
                />
              ) : (
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                    question.type === 'RATING'
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/60 hover:border-blue-300/80'
                      : 'bg-slate-50/80 border-slate-200/60 hover:bg-slate-100/80'
                  }`}
                >
                  {question.type === 'RATING' ? (
                    <>
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border-2 border-blue-300 shadow-sm">
                        {option.emoji ? (
                          <span className="text-2xl">{option.emoji}</span>
                        ) : (
                          <span className="text-xl font-bold text-slate-700">{option.text}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">
                          {option.emoji
                            ? `${option.emoji} ${option.text}`
                            : `Rating ${option.text}`}
                        </div>
                        {option.emoji && (
                          <div className="text-xs text-slate-500 mt-0.5">Number: {option.text}</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-xl min-w-[2rem] text-center">
                        {option.emoji || '○'}
                      </span>
                      <span className="flex-1 font-medium text-slate-900">{option.text}</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingOption(option.id)}
                    className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OptionForm({
  questionId,
  onSave,
  onCancel,
  onComplete,
  questionType,
  existingOptionsCount = 0,
}: {
  questionId: string;
  onSave: (data: any) => void;
  onCancel: () => void;
  onComplete?: () => void;
  questionType?: string;
  existingOptionsCount?: number;
}) {
  const [formData, setFormData] = useState({
    text: '',
    emoji: '',
    order: 0,
  });
  // Options are now auto-created when question is created, not here
  // This component is just for displaying the confirmation message

  const handleAddOption = () => {
    if (!formData.text.trim()) {
      alert('Option text is required');
      return;
    }
    // For RATING questions, prevent adding more than 5 options
    if (questionType === 'RATING' && existingOptionsCount >= 5) {
      alert(
        'Rating questions can only have 5 options (1-5). Please edit existing options instead.'
      );
      return;
    }
    onSave({ questionId, ...formData });
    setFormData({ text: '', emoji: '', order: 0 });
  };

  const emojiSuggestions = ['🎯', '✅', '❌', '⭐', '🔥', '💡', '🎉', '👍', '👎'];

  // For True/False and Rating questions, show simplified interface
  if (questionType === 'TRUE_FALSE') {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✅</span>
          <span className="font-semibold text-slate-900">
            True/False options added automatically
          </span>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          The question now has True and False options. You can add more questions or close this
          form.
        </p>
      </div>
    );
  }

  if (questionType === 'RATING') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200/60 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border-2 border-blue-300">
            <span className="text-lg">⭐</span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900 mb-1">
              Rating options ready ({existingOptionsCount} options)
            </div>
            <p className="text-xs text-slate-600">
              Click "Edit" on any option above to add emoji labels
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50/80 border border-blue-200/60 rounded-xl p-4 mb-2">
      <div onClick={(e) => e.stopPropagation()} className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Option text..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
            />
          </div>
          <div className="flex gap-1.5">
            {emojiSuggestions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFormData({ ...formData, emoji });
                }}
                className={`px-2.5 py-1.5 rounded-lg text-lg transition-all ${
                  formData.emoji === emoji ? 'bg-blue-200 shadow-sm' : 'bg-white hover:bg-slate-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddOption();
            }}
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
          >
            Add Option
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionEditor({
  option,
  questionType,
  questionOptions,
  onSave,
  onCancel,
  onDelete,
  onRefetch,
}: {
  option: any;
  questionType?: string;
  questionOptions?: any[];
  onSave: (data: any) => void;
  onCancel: () => void;
  onDelete: () => void;
  onRefetch: () => void;
}) {
  const [formData, setFormData] = useState({
    text: option.text,
    emoji: option.emoji || '',
  });

  // For RATING questions, the text represents the value (1-5)
  // We'll show it as read-only or allow editing but ensure it stays sequential
  const isRating = questionType === 'RATING';

  const emojiSuggestions = ['🎯', '✅', '❌', '⭐', '🔥', '💡', '🎉', '👍', '👎'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // For RATING, the text value is determined by position, not user input
    // We keep the current value as it represents the rating position
    const submitData = { ...formData };
    if (isRating) {
      // For rating, text should remain as the position value
      // The emoji is what the user can change
      submitData.text = option.text; // Keep original position value
    }
    onSave(submitData);
    onRefetch();
  };

  return (
    <div
      className={`${
        isRating ? 'bg-gradient-to-br from-blue-50 to-purple-50' : 'bg-blue-50/80'
      } border ${isRating ? 'border-blue-300/60' : 'border-blue-200/60'} rounded-xl p-4`}
    >
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="space-y-3">
        {isRating ? (
          // Simplified rating editor - visual and clean
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border-2 border-blue-300 shadow-sm">
                <span className="text-2xl font-bold text-slate-700">{option.text}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-700 mb-1">
                  Rating {option.text}
                </div>
                <div className="text-xs text-slate-500">Add an emoji label (optional)</div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, emoji: '' })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                  !formData.emoji
                    ? 'bg-white border-blue-400 text-blue-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                No Emoji
              </button>
              {emojiSuggestions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`w-10 h-10 rounded-lg text-xl transition-all border-2 flex items-center justify-center ${
                    formData.emoji === emoji
                      ? 'bg-blue-200 border-blue-400 shadow-md scale-110'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:scale-105'
                  }`}
                  title={`Add ${emoji} label`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {formData.emoji && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
                <span className="text-2xl">{formData.emoji}</span>
                <span className="text-lg font-bold text-slate-700">{option.text}</span>
                <span className="text-xs text-slate-500 ml-auto">Preview</span>
              </div>
            )}
          </div>
        ) : (
          // Standard option editor for non-rating questions
          <div className="space-y-3">
            <div className="flex-1">
              <input
                type="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                required
                placeholder="Option text"
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs font-semibold text-slate-600">Emoji:</span>
              {emojiSuggestions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`px-2.5 py-1.5 rounded-lg text-lg transition-all ${
                    formData.emoji === emoji
                      ? 'bg-blue-200 shadow-sm'
                      : 'bg-white hover:bg-slate-100'
                  }`}
                  title={`Add ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-slate-200">
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-semibold transition-colors"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}

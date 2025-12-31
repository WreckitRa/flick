'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
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
  });

  const { data: survey, isLoading } = trpc.survey.get.useQuery(
    { id: surveyId },
    { enabled: !isNew }
  );

  const createMutation = trpc.survey.create.useMutation({
    onSuccess: (data) => {
      router.push(`/surveys/${data.id}`);
    },
  });

  const updateMutation = trpc.survey.update.useMutation({
    onSuccess: () => {
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

  const guestSurveyMutation = trpc.survey.setGuestSurvey.useMutation({
    onSuccess: () => {
      refetchSurvey();
      setSurveyData((prev) => ({ ...prev, isGuestSurvey: !prev.isGuestSurvey }));
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/surveys')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isNew ? 'Create Survey' : survey?.title || 'Edit Survey'}
                </h1>
              </div>
              <div className="flex gap-2">
                {!isNew && (
                  <>
                    <button
                      onClick={() => router.push(`/surveys/${surveyId}/answers`)}
                      className="px-4 py-2 rounded-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200"
                    >
                      View Answers
                    </button>
                    <button
                      onClick={() => handlePublish(!surveyData.published)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        surveyData.published
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {surveyData.published ? 'Unpublish' : 'Publish'}
                    </button>
                    {surveyData.type === 'GUEST' && (
                      <button
                        onClick={() => handleSetGuestSurvey(!surveyData.isGuestSurvey)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          surveyData.isGuestSurvey
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {surveyData.isGuestSurvey ? '⭐ Guest Survey' : 'Set as Guest Survey'}
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {isNew ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Survey Details */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Survey Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={surveyData.title}
                      onChange={(e) => setSurveyData({ ...surveyData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter survey title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={surveyData.description}
                      onChange={(e) =>
                        setSurveyData({ ...surveyData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={surveyData.type}
                      onChange={(e) =>
                        setSurveyData({
                          ...surveyData,
                          type: e.target.value as 'GUEST' | 'DAILY',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="DAILY">Daily Survey</option>
                      <option value="GUEST">Guest Survey</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total coins awarded for completing the survey
                    </p>
                  </div>

                  {!isNew && survey && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Questions:</span> {survey.questions.length}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>{' '}
                          {surveyData.published ? (
                            <span className="text-green-600">Published</span>
                          ) : (
                            <span className="text-gray-600">Draft</span>
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
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Save survey to add questions
                  </h3>
                  <p className="text-gray-600">
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
    </AuthGuard>
  );
}

function QuestionsEditor({ surveyId }: { surveyId: string }) {
  const { data: survey, refetch } = trpc.survey.get.useQuery({ id: surveyId });
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  const createQuestionMutation = trpc.survey.createQuestion.useMutation({
    onSuccess: () => {
      refetch();
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

  if (!survey) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Questions ({survey.questions.length})
        </h2>
        <button
          onClick={() => setShowQuestionForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add Question
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
        {survey.questions.map((question, index) => (
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
              />
            ) : (
              <QuestionCard
                question={question}
                index={index}
                onEdit={() => setEditingQuestion(question.id)}
              />
            )}
          </div>
        ))}
      </div>

      {survey.questions.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions yet</h3>
          <p className="text-gray-600 mb-4">Add your first question to get started</p>
          <button
            onClick={() => setShowQuestionForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
}: {
  question: any;
  index: number;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
              {index + 1}
            </span>
            <h3 className="text-lg font-medium text-gray-900">{question.text}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 ml-11">
            <span className="capitalize">{question.type.toLowerCase().replace('_', ' ')}</span>
            <span>•</span>
            <span>{question.options.length} options</span>
            {question.coinsReward > 0 && (
              <>
                <span>•</span>
                <span className="font-medium">🪙 {question.coinsReward} coins</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
        >
          Edit
        </button>
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
    <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">New Question</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your question..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Type *</label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as any,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="SINGLE_CHOICE">Single Choice (Pick one)</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice (Pick all that apply)</option>
            <option value="TRUE_FALSE">True/False</option>
            <option value="RATING">Rating (1-5 stars)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coins per Answer 🪙
          </label>
          <input
            type="number"
            min="0"
            value={formData.coinsReward}
            onChange={(e) =>
              setFormData({ ...formData, coinsReward: parseInt(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Coins awarded for each answer (participation reward)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Explanation (shown after answering)
          </label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Optional explanation or fun fact..."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Question
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
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
}: {
  question: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  onDelete: () => void;
  onRefetch: () => void;
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
    onSuccess: () => {
      onRefetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="SINGLE_CHOICE">Single Choice</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="TRUE_FALSE">True/False</option>
            <option value="RATING">Rating</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coins per Answer 🪙
          </label>
          <input
            type="number"
            min="0"
            value={formData.coinsReward}
            onChange={(e) =>
              setFormData({ ...formData, coinsReward: parseInt(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Fun fact or explanation shown after answering..."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Save Question
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
          >
            Delete
          </button>
        </div>
      </form>

      {/* Options Section - Outside the form to prevent nested form submission */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-900">Options</h4>
          <button
            type="button"
            onClick={() => setShowOptionForm(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Option
          </button>
        </div>

        {showOptionForm && (
          <OptionForm
            questionId={question.id}
            onSave={(data) => {
              createOptionMutation.mutate(data);
            }}
            onCancel={() => setShowOptionForm(false)}
          />
        )}

        <div className="space-y-2">
          {question.options.map((option: any, index: number) => (
            <div key={option.id}>
              {editingOption === option.id ? (
                <OptionEditor
                  option={option}
                  onSave={(data) => {
                    updateOptionMutation.mutate({ id: option.id, ...data });
                    setEditingOption(null);
                    onRefetch();
                  }}
                  onCancel={() => setEditingOption(null)}
                  onDelete={() => {
                    deleteOptionMutation.mutate({ id: option.id });
                    setEditingOption(null);
                    onRefetch();
                  }}
                  onRefetch={onRefetch}
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">{option.emoji || '○'}</span>
                  <span className="flex-1">{option.text}</span>
                  <button
                    type="button"
                    onClick={() => setEditingOption(option.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
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
}: {
  questionId: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    text: '',
    emoji: '',
    order: 0,
  });

  const handleAddOption = () => {
    if (!formData.text.trim()) {
      alert('Option text is required');
      return;
    }
    onSave({ questionId, ...formData });
    setFormData({ text: '', emoji: '', order: 0 });
  };

  const emojiSuggestions = ['🎯', '✅', '❌', '⭐', '🔥', '💡', '🎉', '👍', '👎'];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
      <div onClick={(e) => e.stopPropagation()} className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Option text..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
            />
          </div>
          <div className="flex gap-1">
            {emojiSuggestions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFormData({ ...formData, emoji });
                }}
                className={`px-2 py-1 rounded ${
                  formData.emoji === emoji ? 'bg-blue-200' : 'bg-white hover:bg-gray-100'
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
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
  onSave,
  onCancel,
  onDelete,
  onRefetch,
}: {
  option: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  onDelete: () => void;
  onRefetch: () => void;
}) {
  const [formData, setFormData] = useState({
    text: option.text,
    emoji: option.emoji || '',
  });

  const emojiSuggestions = ['🎯', '✅', '❌', '⭐', '🔥', '💡', '🎉', '👍', '👎'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(formData);
    onRefetch();
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="space-y-3"
      >
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex gap-1">
            {emojiSuggestions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormData({ ...formData, emoji })}
                className={`px-2 py-1 rounded ${
                  formData.emoji === emoji ? 'bg-blue-200' : 'bg-white hover:bg-gray-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}


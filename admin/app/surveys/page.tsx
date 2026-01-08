'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';

export default function SurveysPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'GUEST' | 'DAILY'>('all');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [showImportModal, setShowImportModal] = useState(false);

  const { data, isLoading, refetch } = trpc.survey.list.useQuery({
    type: filter === 'all' ? undefined : filter,
    published: publishedFilter === 'all' ? undefined : publishedFilter === 'published',
  });

  const publishMutation = trpc.survey.publish.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.survey.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const importMutation = trpc.survey.importFromCSV.useMutation({
    onSuccess: (result) => {
      alert(`✅ Survey "${result.title}" imported successfully with ${result.questionCount} questions!`);
      setShowImportModal(false);
      refetch();
    },
    onError: (error) => {
      alert(`❌ Import failed: ${error.message}`);
    },
  });

  const handlePublish = (id: string, published: boolean) => {
    publishMutation.mutate({ id, published });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate({ id });
  };

  const totalSurveys = data?.length || 0;
  const publishedCount = data?.filter((s: { published: boolean }) => s.published).length || 0;
  const draftCount = totalSurveys - publishedCount;
  const totalAnswers = data?.reduce((sum: number, s: { answerCount: number }) => sum + s.answerCount, 0) || 0;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Surveys</h1>
                <p className="text-slate-600">Create and manage surveys</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 hover:scale-105"
                >
                  <span>📥</span>
                  <span>Import CSV</span>
                </button>
                <button
                  onClick={() => router.push('/surveys/new')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105"
                >
                  <span>➕</span>
                  <span>Create Survey</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass rounded-xl p-4">
                <p className="text-sm font-medium text-slate-600 mb-1">Total Surveys</p>
                <p className="text-2xl font-bold text-slate-900">{totalSurveys}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-sm font-medium text-slate-600 mb-1">Published</p>
                <p className="text-2xl font-bold text-emerald-600">{publishedCount}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-sm font-medium text-slate-600 mb-1">Drafts</p>
                <p className="text-2xl font-bold text-amber-600">{draftCount}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-sm font-medium text-slate-600 mb-1">Total Answers</p>
                <p className="text-2xl font-bold text-slate-900">{totalAnswers}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="glass rounded-xl p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      filter === 'all'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setFilter('GUEST')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      filter === 'GUEST'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Guest
                  </button>
                  <button
                    onClick={() => setFilter('DAILY')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      filter === 'DAILY'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Daily
                  </button>
                </div>

                <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setPublishedFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      publishedFilter === 'all'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={() => setPublishedFilter('published')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      publishedFilter === 'published'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Published
                  </button>
                  <button
                    onClick={() => setPublishedFilter('draft')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      publishedFilter === 'draft'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Draft
                  </button>
                </div>
              </div>
            </div>

            {/* Surveys Grid */}
            {isLoading ? (
              <div className="glass rounded-xl p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-slate-500">Loading surveys...</p>
              </div>
            ) : !data?.length ? (
              <div className="glass rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No surveys yet</h3>
                <p className="text-slate-600 mb-6">Create your first survey to get started</p>
                <button
                  onClick={() => router.push('/surveys/new')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Create Survey
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((survey: { id: string; title: string; published: boolean; isGuestSurvey: boolean; type: string; questionCount: number; answerCount: number; description?: string | null; coinsReward: number; [key: string]: any }, index: number) => (
                  <div
                    key={survey.id}
                    className="glass rounded-2xl p-6 card-hover animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 flex-1 min-w-0">{survey.title}</h3>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                            survey.published
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                          }`}
                        >
                          {survey.published ? '✓ Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {survey.isGuestSurvey && (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 rounded-full border border-amber-200/60 whitespace-nowrap">
                            ⭐ Guest
                          </span>
                        )}
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <span className="capitalize font-medium">{survey.type.toLowerCase()}</span>
                          <span>•</span>
                          <span>{survey.questionCount} questions</span>
                          <span>•</span>
                          <span>{survey.answerCount} answers</span>
                        </div>
                      </div>
                    </div>

                    {survey.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {survey.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🪙</span>
                        <span className="text-sm font-semibold text-slate-900">{survey.coinsReward} coins</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/surveys/${survey.id}`)}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                        >
                          Edit
                        </button>
                        {survey.answerCount > 0 && (
                          <button
                            onClick={() => router.push(`/surveys/${survey.id}/answers`)}
                            className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors"
                            title={`View ${survey.answerCount} answers`}
                          >
                            Answers ({survey.answerCount})
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                      <button
                        onClick={() => handlePublish(survey.id, !survey.published)}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                          survey.published
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                        }`}
                      >
                        {survey.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(survey.id, survey.title)}
                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors border border-red-200/60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CSV Import Modal */}
          {showImportModal && (
            <CSVImportModal
              onImport={(csvContent) => importMutation.mutate({ csvContent })}
              onClose={() => setShowImportModal(false)}
              isLoading={importMutation.isPending}
            />
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

function CSVImportModal({
  onImport,
  onClose,
  isLoading,
}: {
  onImport: (csvContent: string) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [csvContent, setCsvContent] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
      };
      reader.readAsText(file);
    }
  };

  const csvTemplate = `title,description,type,coinsReward,publishAt,expiryType,expiresAt,expiryDays,questionText,questionType,questionCoinsReward,questionExplanation,optionText,optionEmoji,optionIsCorrect
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,What is the capital of France?,SINGLE_CHOICE,5,Paris is the capital and largest city of France,Paris,🇫🇷,true
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,What is the capital of France?,SINGLE_CHOICE,5,Paris is the capital and largest city of France,London,🇬🇧,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,What is the capital of France?,SINGLE_CHOICE,5,Paris is the capital and largest city of France,Berlin,🇩🇪,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,What is the capital of France?,SINGLE_CHOICE,5,Paris is the capital and largest city of France,Madrid,🇪🇸,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,The Earth is round,TRUE_FALSE,3,The Earth is approximately spherical,True,✅,true
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,The Earth is round,TRUE_FALSE,3,The Earth is approximately spherical,False,❌,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,Rate your experience,RATING,2,How satisfied are you?,1,😞,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,Rate your experience,RATING,2,How satisfied are you?,2,😐,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,Rate your experience,RATING,2,How satisfied are you?,3,🙂,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,Rate your experience,RATING,2,How satisfied are you?,4,😊,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,Rate your experience,RATING,2,How satisfied are you?,5,😍,false`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Import Survey from CSV</h2>
              <p className="text-sm text-slate-600 mt-1">Upload a CSV file to create a survey with questions and options</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              />
            </div>

            {/* CSV Content Preview */}
            {csvContent && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  CSV Content Preview
                </label>
                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white font-mono text-xs resize-none"
                />
              </div>
            )}

            {/* Template Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">CSV Template & Format</h3>
                <button
                  onClick={() => setShowTemplate(!showTemplate)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {showTemplate ? 'Hide' : 'Show'} Template
                </button>
              </div>
              <div className="text-xs text-slate-600 space-y-2">
                <p><strong>Required columns:</strong> title, type, questionText</p>
                <p><strong>Optional columns:</strong> description, coinsReward, publishAt, expiryType, expiresAt, expiryDays, questionType, questionCoinsReward, questionExplanation, optionText, optionEmoji, optionIsCorrect</p>
                <p><strong>Notes:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Survey type must be GUEST or DAILY</li>
                  <li>Question type must be SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, or RATING</li>
                  <li>Expiry type must be SPECIFIC_DATE or RELATIVE_DAYS (or leave empty for no expiry)</li>
                  <li>Dates must be in ISO format (YYYY-MM-DDTHH:mm:ssZ)</li>
                  <li>Each row defines one option. Repeat survey/question data for multiple options</li>
                  <li>optionIsCorrect should be "true" or "false"</li>
                </ul>
              </div>
              {showTemplate && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-700">Template Example:</label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(csvTemplate);
                        alert('Template copied to clipboard!');
                      }}
                      className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      Copy Template
                    </button>
                  </div>
                  <pre className="bg-white border border-slate-300 rounded-lg p-3 overflow-x-auto text-xs font-mono">
                    {csvTemplate}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onImport(csvContent)}
            disabled={!csvContent || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importing...' : 'Import Survey'}
          </button>
        </div>
      </div>
    </div>
  );
}

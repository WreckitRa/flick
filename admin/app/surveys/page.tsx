'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { trpc } from '@/lib/trpc';

export default function SurveysPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'GUEST' | 'DAILY'>('all');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');

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

  const handlePublish = (id: string, published: boolean) => {
    publishMutation.mutate({ id, published });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate({ id });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
              <p className="text-gray-600 mt-1">Create and manage surveys</p>
            </div>
            <button
              onClick={() => router.push('/surveys/new')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Create Survey
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('GUEST')}
                className={`px-4 py-2 rounded ${
                  filter === 'GUEST' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Guest
              </button>
              <button
                onClick={() => setFilter('DAILY')}
                className={`px-4 py-2 rounded ${
                  filter === 'DAILY' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Daily
              </button>
            </div>

            <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setPublishedFilter('all')}
                className={`px-4 py-2 rounded ${
                  publishedFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPublishedFilter('published')}
                className={`px-4 py-2 rounded ${
                  publishedFilter === 'published'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setPublishedFilter('draft')}
                className={`px-4 py-2 rounded ${
                  publishedFilter === 'draft'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Draft
              </button>
            </div>
          </div>

          {/* Surveys Grid */}
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading surveys...</div>
          ) : !data?.length ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No surveys yet</h3>
              <p className="text-gray-600 mb-6">Create your first survey to get started</p>
              <button
                onClick={() => router.push('/surveys/new')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Survey
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((survey) => (
                <div
                  key={survey.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{survey.title}</h3>
                        {survey.isGuestSurvey && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Guest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="capitalize">{survey.type.toLowerCase()}</span>
                        <span>•</span>
                        <span>{survey.questionCount} questions</span>
                        <span>•</span>
                        <span>{survey.answerCount} answers</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        survey.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {survey.published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  {survey.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {survey.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">🪙 {survey.coinsReward} coins</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/surveys/${survey.id}`)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      {survey.answerCount > 0 && (
                        <button
                          onClick={() => router.push(`/surveys/${survey.id}/answers`)}
                          className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded font-medium"
                          title={`View ${survey.answerCount} answers`}
                        >
                          Answers ({survey.answerCount})
                        </button>
                      )}
                      <button
                        onClick={() => handlePublish(survey.id, !survey.published)}
                        className={`px-3 py-1 text-sm rounded ${
                          survey.published
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {survey.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(survey.id, survey.title)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}


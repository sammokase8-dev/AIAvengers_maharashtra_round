import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Send,
  Clock,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  ExternalLink,
} from 'lucide-react';
import { publishingApi } from '../../services/publishingApi';
import { ScheduledPost, PublishingStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/common/EmptyState';

export const PublishingPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, error: toastError, info } = useToast();

  const [statusFilter, setStatusFilter] = useState<PublishingStatus | 'all'>('all');
  const [reschedulingPost, setReschedulingPost] = useState<ScheduledPost | null>(null);
  const [newDateTime, setNewDateTime] = useState('');

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['publishing-queue', statusFilter],
    queryFn: () =>
      publishingApi.getScheduledPosts({
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  const publishNowMutation = useMutation({
    mutationFn: (postId: string) => publishingApi.publishNow(postId),
    onSuccess: (publishedPost) => {
      queryClient.invalidateQueries({ queryKey: ['publishing-queue'] });
      success(`Published "${publishedPost.title}" successfully.`);
    },
    onError: (err) => toastError(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (postId: string) => publishingApi.cancelScheduledPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishing-queue'] });
      info('Schedule removed from CreatorAI.');
    },
    onError: (err) => toastError(err.message),
  });

  const retryMutation = useMutation({
    mutationFn: (postId: string) => publishingApi.retryFailedPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishing-queue'] });
      success('Retrying publishing dispatch.');
    },
    onError: (err) => toastError(err.message),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ postId, newTime }: { postId: string; newTime: string }) =>
      publishingApi.reschedulePost(postId, newTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishing-queue'] });
      success('Schedule updated in CreatorAI.');
      setReschedulingPost(null);
    },
    onError: (err) => toastError(err.message),
  });

  // Calculate counts
  const totalScheduled = posts.filter((p) => p.status === 'scheduled').length;
  const totalPublishing = posts.filter((p) => p.status === 'publishing').length;
  const totalPublished = posts.filter((p) => p.status === 'published').length;
  const totalFailed = posts.filter((p) => p.status === 'failed').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            <Send className="w-3.5 h-3.5" />
            <span>{t('publishing.title')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('publishing.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {t('publishing.subtitle')}
          </p>
        </div>
      </div>

      <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Scheduled items are saved in CreatorAI only. No external platform is connected and automatic publishing is not configured.
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('publishing.scheduledQueue')}</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalScheduled}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('publishing.inDispatch')}</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{totalPublishing}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Send className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('publishing.published')}</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{totalPublished}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('publishing.failedRetries')}</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">{totalFailed}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'scheduled', 'publishing', 'published', 'failed', 'draft'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
              statusFilter === s
                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {s === 'all' ? t('common.all') : s}
          </button>
        ))}
      </div>

      {/* Publishing Queue Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div role="status" className="p-8 text-center text-sm text-slate-600">
            Loading publishing queue…
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Send}
            title={t('common.noPostsQueue')}
            description={t('common.noPostsDesc')}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-4 min-w-0">
                  {post.thumbnailUrl ? (
                    <img
                      src={post.thumbnailUrl}
                      alt=""
                      className="w-20 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div aria-hidden="true" className="w-20 h-14 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-500">
                      <Play className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-snug">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>
                        {new Date(post.scheduledTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {post.platforms.map((p) => (
                          <span
                            key={p}
                            className="text-[9px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Error message callout */}
                    {post.errorMessage && (
                      <div className="mt-2 text-[11px] text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{post.errorMessage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status Pill & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant={
                      post.status === 'published'
                        ? 'success'
                        : post.status === 'scheduled'
                        ? 'purple'
                        : post.status === 'publishing'
                        ? 'primary'
                        : post.status === 'failed'
                        ? 'danger'
                        : 'default'
                    }
                    size="md"
                    dot={post.status === 'publishing'}
                  >
                    {post.status}
                  </Badge>

                  {/* Contextual Actions */}
                  <div className="flex items-center gap-1.5">
                    {post.status === 'scheduled' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => publishNowMutation.mutate(post.id)}
                          leftIcon={<Send className="w-3.5 h-3.5" />}
                        >
                          {t('publishing.publishNow')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setReschedulingPost(post);
                            setNewDateTime(post.scheduledTime.slice(0, 16));
                          }}
                        >
                          {t('publishing.reschedule')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelMutation.mutate(post.id)}
                          title="Cancel scheduled post"
                        >
                          {t('publishing.cancel')}
                        </Button>
                      </>
                    )}

                    {post.status === 'failed' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => retryMutation.mutate(post.id)}
                        leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                      >
                        {t('publishing.retryPost')}
                      </Button>
                    )}

                    {post.status === 'published' && post.publishedUrls && (
                      <a
                        href={Object.values(post.publishedUrls)[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors"
                      >
                        <span>{t('common.viewLive')}</span>
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {reschedulingPost && (
        <Modal
          isOpen={!!reschedulingPost}
          onClose={() => setReschedulingPost(null)}
          title={t('common.rescheduleTitle')}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <Input
              label={t('common.newScheduledTime')}
              type="datetime-local"
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setReschedulingPost(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  rescheduleMutation.mutate({
                    postId: reschedulingPost.id,
                    newTime: new Date(newDateTime).toISOString(),
                  })
                }
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default PublishingPage;

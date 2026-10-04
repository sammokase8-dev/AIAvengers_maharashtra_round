import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  Send,
  CheckCircle,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { publishingApi } from '../../services/publishingApi';
import { ScheduledPost, PublishingStatus, PlatformType, CalendarViewMode } from '../../types';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

const STATUS_FILTERS: Array<{ id: PublishingStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All Statuses' },
  { id: 'draft', label: 'Draft' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' },
  { id: 'failed', label: 'Failed' },
];

export const ContentCalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedStatus, setSelectedStatus] = useState<PublishingStatus | 'all'>('all');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // New post form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-04-08');
  const [newTime, setNewTime] = useState('18:00');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([
    'youtube',
    'instagram_reels',
  ]);

  // Load scheduled posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['calendar-posts', selectedStatus],
    queryFn: () =>
      publishingApi.getScheduledPosts({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      }),
  });

  const scheduleMutation = useMutation({
    mutationFn: (payload: Partial<ScheduledPost>) => publishingApi.schedulePost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      success('Post successfully scheduled on calendar.');
      setIsScheduleModalOpen(false);
      setNewTitle('');
    },
  });

  const handleCreatePost = () => {
    if (!newTitle.trim()) {
      toastError('Please enter a post title.');
      return;
    }
    const scheduledDateTime = new Date(`${newDate}T${newTime}:00Z`).toISOString();
    scheduleMutation.mutate({
      title: newTitle,
      scheduledTime: scheduledDateTime,
      platforms: selectedPlatforms,
      status: 'scheduled',
    });
  };

  const togglePlatform = (p: PlatformType) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Distribution Timetable</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('calendar.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {t('calendar.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsScheduleModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('calendar.schedulePost')}
          </Button>
        </div>
      </div>

      {/* View Mode & Filter Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Month / Week / List toggle */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{t('calendar.monthView')}</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('calendar.weekView')}</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{t('calendar.listQueue')}</span>
          </button>
        </div>

        {/* Status Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStatus(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
                selectedStatus === s.id
                  ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid Representation */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 tracking-wide">APRIL 2026</h2>
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center text-[11px] font-semibold text-slate-600 py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-white">
            {Array.from({ length: 35 }).map((_, index) => {
              const dayNumber = index - 2; // Offset for month starting on Wednesday
              const isValidDay = dayNumber > 0 && dayNumber <= 30;

              // Find posts on this day
              const dayPosts = posts.filter((p) => {
                if (!isValidDay) return false;
                const d = new Date(p.scheduledTime);
                return d.getDate() === dayNumber;
              });

              return (
                <div
                  key={index}
                  className={`min-h-[115px] p-2.5 flex flex-col justify-between transition-colors ${
                    isValidDay ? 'hover:bg-slate-50/80' : 'bg-slate-50/50 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        dayNumber === 3 ? 'text-blue-600 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {isValidDay ? dayNumber : ''}
                    </span>
                    {dayNumber === 3 && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" title="Today" />
                    )}
                  </div>

                  {/* Day Posts */}
                  <div className="space-y-1 my-1">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        className={`p-1.5 rounded text-[10px] truncate border font-medium ${
                          post.status === 'scheduled'
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : post.status === 'published'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                        title={post.title}
                      >
                        {post.title}
                      </div>
                    ))}
                  </div>

                  {isValidDay && (
                    <button
                      onClick={() => {
                        setNewDate(`2026-04-${dayNumber.toString().padStart(2, '0')}`);
                        setIsScheduleModalOpen(true);
                      }}
                      className="text-[10px] text-slate-400 hover:text-blue-600 opacity-0 hover:opacity-100 transition-opacity text-left font-medium"
                    >
                      + Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week or List View */}
      {(viewMode === 'list' || viewMode === 'week') && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
          {posts.map((post) => (
            <div key={post.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={
                    post.thumbnailUrl ||
                    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop&q=80'
                  }
                  alt={post.title}
                  className="w-16 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>
                      {new Date(post.scheduledTime).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1">
                  {post.platforms.map((p) => (
                    <span
                      key={p}
                      className="text-[9px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>

                <Badge
                  variant={
                    post.status === 'published'
                      ? 'success'
                      : post.status === 'scheduled'
                      ? 'purple'
                      : post.status === 'failed'
                      ? 'danger'
                      : 'default'
                  }
                  size="sm"
                >
                  {post.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Post Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={t('calendar.schedulePost')}
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            label={t('common.postTitle')}
            placeholder={t('common.postTitlePlaceholder')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('calendar.publishDate')}
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <Input
              label={t('calendar.publishTime')}
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              {t('calendar.channels')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  'youtube',
                  'youtube_shorts',
                  'instagram_reels',
                  'tiktok',
                  'linkedin',
                  'x',
                ] as PlatformType[]
              ).map((p) => {
                const checked = selectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium uppercase transition-all flex items-center justify-between ${
                      checked
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{p.replace('_', ' ')}</span>
                    {checked && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreatePost}>
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ContentCalendarPage;

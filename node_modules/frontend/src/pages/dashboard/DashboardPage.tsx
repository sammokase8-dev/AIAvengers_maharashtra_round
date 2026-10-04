import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Layers,
  Clock,
  Film,
  FolderOpen,
  Send,
  Eye,
  TrendingUp,
  ArrowRight,
  Plus,
  Play,
  Share2,
  Calendar,
  AlertTriangle,
  Lightbulb,
  Scissors,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { contentApi } from '../../services/contentApi';
import { assetsApi } from '../../services/assetsApi';
import { publishingApi } from '../../services/publishingApi';
import { analyticsApi } from '../../services/analyticsApi';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import VideoPlayer from '../../components/common/VideoPlayer';
import { SkeletonStatCard, SkeletonCard } from '../../components/common/SkeletonLoader';
import { ErrorState } from '../../components/common/EmptyState';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const pipelineStages = [
    { key: 'idea', label: t('common.idea'), color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { key: 'draft', label: t('common.draft'), color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'editing', label: t('common.editing'), color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'review', label: t('common.review'), color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { key: 'scheduled', label: t('common.scheduled'), color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { key: 'published', label: t('common.published'), color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  // Fetch projects
  const {
    data: projects,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => contentApi.getProjects(),
  });

  // Fetch assets
  const { data: assets, isLoading: isAssetsLoading } = useQuery({
    queryKey: ['assets', 'recent'],
    queryFn: () => assetsApi.getAssets({ sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  // Fetch upcoming scheduled posts
  const { data: scheduledPosts, isLoading: isScheduledLoading } = useQuery({
    queryKey: ['publishing', 'scheduled'],
    queryFn: () => publishingApi.getScheduledPosts(),
  });

  // Fetch analytics summary
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.getDashboardAnalytics('30d'),
  });

  // Fetch AI insights
  const { data: insights, isLoading: isInsightsLoading } = useQuery({
    queryKey: ['creator', 'insights'],
    queryFn: () => analyticsApi.getCreatorInsights(),
  });

  if (isProjectsError) {
    return <ErrorState onRetry={() => refetchProjects()} />;
  }

  // Count by pipeline stage
  const stageCounts = (projects || []).reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const creatorName = user?.name || 'Alex Rivera';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('dashboard.greeting')}, {creatorName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NavLink to="/ai-studio">
            <Button variant="secondary" size="md" leftIcon={<Sparkles className="w-4 h-4 text-blue-600" />}>
              {t('nav.aiStudio')}
            </Button>
          </NavLink>
          <NavLink to="/workspace">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              {t('common.create')}
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isAnalyticsLoading || isProjectsLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-medium">{t('dashboard.activeProjects')}</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                  {projects?.length || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{t('common.acrossStages')}</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-medium">{t('dashboard.totalViews')}</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                  {analyticsData?.metrics.views.value || '1.42M'}
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-mono font-medium">
                  <TrendingUp className="w-3 h-3" /> +24.8% {t('common.vsLastMonth')}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-medium">{t('dashboard.scheduledContent')}</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                  {scheduledPosts?.filter((p) => p.status === 'scheduled').length || 1}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{t('common.queuedSync')}</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-medium">{t('dashboard.totalAssets')}</span>
                <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <FolderOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                  {assets?.length || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{t('common.assetsMedia')}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Content Pipeline Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> {t('dashboard.pipelineTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('dashboard.pipelineSubtitle')}
            </p>
          </div>
          <NavLink to="/workspace" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
            {t('common.openWorkspace')} &rarr;
          </NavLink>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {pipelineStages.map((stage) => {
            const count = stageCounts[stage.key] || 0;
            return (
              <div
                key={stage.key}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    {stage.label}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      count > 0 ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 font-mono">{count}</span>
                  <span className="text-[11px] text-slate-500">{t('common.items')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: AI Recommendations, Video Production Preview & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Video Production Preview & Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real Video Player Preview In Studio Workspace */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-md text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-white font-mono">{t('common.liveVideoPreview')}</span>
              </div>
              <NavLink to="/editor">
                <Button variant="primary" size="sm">
                  {t('common.openEditor')}
                </Button>
              </NavLink>
            </div>
            <VideoPlayer
              src="/media/demo_main.mp4"
              poster="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80"
              title="Episode 42: Master Studio Take (UHD)"
              aspectRatio="16:9"
              showCustomControls={true}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{t('common.formatUHD')}</span>
              <span className="text-emerald-400 font-semibold">{t('common.syncNotice')}</span>
            </div>
          </div>

          {/* AI Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> {t('dashboard.aiRecommendationsTitle')}
              </h2>
              <NavLink to="/intelligence" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                {t('intelligence.allInsights')} &rarr;
              </NavLink>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isInsightsLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                (insights || []).slice(0, 4).map((ins) => (
                  <div
                    key={ins.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge
                          variant={
                            ins.severity === 'high_impact'
                              ? 'warning'
                              : ins.severity === 'positive'
                              ? 'success'
                              : 'info'
                          }
                          size="sm"
                        >
                          {ins.category}
                        </Badge>
                        {ins.metricComparison && (
                          <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                            {ins.metricComparison.currentValue}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 leading-snug">{ins.title}</h3>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {ins.description}
                      </p>
                    </div>

                    {ins.recommendedAction && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="text-[11px] text-slate-700 font-medium">
                          {t('common.action')}: <span className="text-slate-500">{ins.recommendedAction}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Content Projects List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Film className="w-4 h-4 text-blue-600" /> {t('dashboard.recentProjectsTitle')}
              </h3>
              <NavLink to="/workspace" className="text-xs text-slate-500 hover:text-slate-900 font-medium">
                {t('common.viewAll')} ({projects?.length || 0})
              </NavLink>
            </div>

            {projects && projects.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-14 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 truncate">{project.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          <span>{project.stats?.assetsCount || 0} {t('common.assetsMedia')}</span>
                          <span>•</span>
                          <span className="capitalize text-blue-700 font-sans font-medium">{project.status}</span>
                        </div>
                      </div>
                    </div>

                    <NavLink to="/editor">
                      <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        {t('common.openEditor')}
                      </Button>
                    </NavLink>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Film className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">{t('dashboard.emptyProjectsTitle')}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {t('dashboard.emptyProjectsDesc')}
                </p>
                <NavLink to="/workspace" className="inline-block mt-4">
                  <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    {t('dashboard.createFirstProject')}
                  </Button>
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Upcoming Schedule & Top Content */}
        <div className="space-y-6">
          {/* Upcoming Schedule */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" /> {t('dashboard.upcomingScheduleTitle')}
              </h3>
              <NavLink to="/calendar" className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
                {t('nav.calendar')} &rarr;
              </NavLink>
            </div>

            <div className="mt-3 space-y-3">
              {(scheduledPosts || []).slice(0, 3).map((post) => (
                <div key={post.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-mono text-purple-700 font-medium">
                      {new Date(post.scheduledTime).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <Badge variant={post.status === 'scheduled' ? 'success' : 'default'} size="sm">
                      {post.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">{post.title}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {post.platforms.map((p) => (
                      <span
                        key={p}
                        className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Leaderboard */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> {t('dashboard.topContentTitle')}
              </h3>
              <NavLink to="/analytics" className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold">
                {t('nav.analytics')} &rarr;
              </NavLink>
            </div>

            <div className="mt-3 space-y-3">
              {(analyticsData?.topContent || []).slice(0, 3).map((content) => (
                <div key={content.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-slate-900 truncate">{content.title}</p>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {content.views.toLocaleString()} views • {content.retentionPercent}% retention
                    </span>
                  </div>
                  <Badge variant="success" size="sm">
                    {content.platform}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

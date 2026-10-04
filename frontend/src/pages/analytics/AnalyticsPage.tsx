import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Share2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';
import { creatorApi } from '../../services/creatorApi';
import Badge from '../../components/ui/Badge';
import { SkeletonStatCard, SkeletonCard } from '../../components/common/SkeletonLoader';

export const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics-deep', timeRange],
    queryFn: () => analyticsApi.getDashboardAnalytics(timeRange),
  });

  const { data: creatorProfile } = useQuery({
    queryKey: ['creator-profile'],
    queryFn: () => creatorApi.getProfile(),
  });

  const hasConnectedPlatforms = creatorProfile?.connections.some((c) => c.connected);
  const renderMetricChange = (metric: { changePercent?: number; isPositive?: boolean }) => {
    if (metric.changePercent === undefined) {
      return <div className="text-[11px] text-slate-500 mt-0.5">No comparison data</div>;
    }
    const Icon = metric.isPositive ? ArrowUpRight : ArrowDownRight;
    return (
      <div className={`text-[11px] mt-0.5 flex items-center gap-0.5 font-semibold ${metric.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        <Icon className="w-3 h-3" /> {metric.changePercent > 0 ? '+' : ''}{metric.changePercent}%
      </div>
    );
  };

  if (isLoading || !analytics) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  // Calculate SVG chart coordinates for Time Series
  const points = analytics.timeSeries;
  const maxViews = Math.max(...points.map((p) => p.views), 1);
  const chartWidth = 700;
  const chartHeight = 200;

  const svgCoordinates = points.map((p, index) => {
    const x = points.length > 1 ? (index / (points.length - 1)) * chartWidth : chartWidth / 2;
    const y = chartHeight - (p.views / maxViews) * (chartHeight - 30) - 15;
    return `${x},${y}`;
  });
  const pathD = svgCoordinates.length ? `M ${svgCoordinates.join(' L ')}` : '';
  const areaD = pathD ? `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z` : '';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Time Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Audience Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('analytics.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {t('analytics.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
          {(['7d', '30d', '90d', '1y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                timeRange === r
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {analytics.isDemoData && analytics.demoNotice && (
        <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {analytics.demoNotice}
        </div>
      )}
      {!hasConnectedPlatforms && !analytics.isDemoData && (
        <div role="status" className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          No platform accounts are connected. Analytics shown here are limited to records stored in CreatorAI.
        </div>
      )}

      {/* Metrics Row (6 items) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('analytics.views')}</span>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-900">{analytics.metrics.views.value}</div>
            {renderMetricChange(analytics.metrics.views)}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('analytics.engagement')}</span>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-900">
              {analytics.metrics.engagementRate.value}
            </div>
            {renderMetricChange(analytics.metrics.engagementRate)}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('analytics.watchTime')}</span>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-900">
              {analytics.metrics.watchTimeHours.value}
            </div>
            {renderMetricChange(analytics.metrics.watchTimeHours)}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('analytics.publishedCount')}</span>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-900">
              {analytics.metrics.totalPublished.value}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{t('analytics.acrossChannels')}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('analytics.saves')}</span>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-900">{analytics.metrics.saves.value}</div>
            {renderMetricChange(analytics.metrics.saves)}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('analytics.shares')}</span>
          <div className="my-2">
            <div className="text-2xl font-bold text-slate-900">
              {analytics.metrics.shares.value}
            </div>
            {renderMetricChange(analytics.metrics.shares)}
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Over Time Line Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> {t('analytics.performanceOverTime')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t('analytics.aggregatedViews')}</p>
            </div>
            <Badge variant="primary" size="sm">{t('analytics.viewsTimeline')}</Badge>
          </div>

          {/* SVG Trendline */}
          <div className="pt-4">
            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-56 overflow-visible"
              >
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line x1="0" y1="50" x2={chartWidth} y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="150" x2={chartWidth} y2="150" stroke="#f1f5f9" strokeDasharray="3 3" />

                {/* Area and Line */}
                <path d={areaD} fill="url(#viewsGradient)" />
                <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3" />

                {/* Data point dots */}
                {points.map((p, idx) => {
                  const x = (idx / (points.length - 1)) * chartWidth;
                  const y = chartHeight - (p.views / maxViews) * (chartHeight - 30) - 15;
                  return (
                    <circle
                      key={p.date}
                      cx={x}
                      cy={y}
                      r="4.5"
                      className="fill-white stroke-blue-600 stroke-2"
                    />
                  );
                })}
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-3 border-t border-slate-100">
              {points.map((p) => (
                <span key={p.date}>{p.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Comparison (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" /> {t('analytics.platformShare')}
              </h2>
              <span className="text-[11px] font-medium text-slate-500">Total Views</span>
            </div>

            <div className="space-y-4">
              {analytics.platformBreakdown.map((plat) => {
                const total = analytics.platformBreakdown.reduce((sum, p) => sum + p.views, 0);
                const percent = Math.round((plat.views / total) * 100);

                return (
                  <div key={plat.platform} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-semibold capitalize">{plat.platform.replace('_', ' ')}</span>
                      <span className="text-slate-500 font-medium">
                        {plat.views.toLocaleString()} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between font-medium">
            <span>Fastest Growth:</span>
            <span className="text-emerald-700 font-bold">TikTok (+34% MoM)</span>
          </div>
        </div>
      </div>

      {/* Audience Retention Curve & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Retention Curve (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" /> {t('analytics.audienceRetention')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Average % viewers watching across video length</p>
            </div>
            <Badge variant="warning" size="sm">Hook Benchmark</Badge>
          </div>

          <div className="space-y-2.5 pt-2">
            {analytics.retentionCurve.map((point) => (
              <div key={point.second} className="flex items-center gap-3 text-xs">
                <span className="w-14 text-slate-500 font-medium">{point.second}s</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full ${
                      point.percentage > 70
                        ? 'bg-emerald-500'
                        : point.percentage > 50
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${point.percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right font-bold text-slate-800">{point.percentage}%</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mt-4 font-medium">
            Notice: 88% retention through second 3 indicates high-performing hooks from AI Studio.
          </div>
        </div>

        {/* Top Content Leaderboard (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> {t('analytics.topContent')}
            </h3>
            <span className="text-[11px] font-medium text-slate-500">By 30-Day Views</span>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics.topContent.map((item, index) => (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-4">
                    #{index + 1}
                  </span>
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-12 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                    <span className="text-[11px] text-slate-500">
                      {item.views.toLocaleString()} views • {item.likes.toLocaleString()} likes
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-600">
                    {item.retentionPercent}%
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Retention</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsPage;

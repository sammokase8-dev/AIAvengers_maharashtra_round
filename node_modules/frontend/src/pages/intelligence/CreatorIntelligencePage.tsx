import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Target,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';
import { InsightCategory } from '../../types';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/common/SkeletonLoader';

const CATEGORIES: Array<{ id: InsightCategory | 'all'; labelKey: string; icon: LucideIcon }> = [
  { id: 'all', labelKey: 'allInsights', icon: BrainCircuit },
  { id: 'performance', labelKey: 'performance', icon: TrendingUp },
  { id: 'patterns', labelKey: 'patterns', icon: Zap },
  { id: 'actions', labelKey: 'actions', icon: Target },
  { id: 'opportunities', labelKey: 'opportunities', icon: Lightbulb },
];

export const CreatorIntelligencePage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory | 'all'>('all');

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['creator-intelligence-insights'],
    queryFn: () => analyticsApi.getCreatorInsights(),
  });

  const filteredInsights =
    selectedCategory === 'all'
      ? insights
      : insights.filter((i) => i.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Algorithmic Intelligence Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('intelligence.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {t('intelligence.subtitle')}
          </p>
        </div>

        <NavLink to="/ai-studio">
          <Button variant="accent" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Generate Next Topic in Studio
          </Button>
        </NavLink>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t(`intelligence.${cat.labelKey}`)}</span>
            </button>
          );
        })}
      </div>

      {/* Insights Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredInsights.length === 0 ? (
          <div role="status" className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-sm font-semibold text-slate-900">No evidence-backed insights yet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
              CreatorAI needs real analytics snapshots before it can make recommendations. Demo sample claims have been removed.
            </p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all space-y-5"
            >
              <div className="space-y-3.5">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      insight.severity === 'high_impact'
                        ? 'warning'
                        : insight.severity === 'positive'
                        ? 'success'
                        : insight.severity === 'warning'
                        ? 'danger'
                        : 'info'
                    }
                    size="sm"
                    dot
                  >
                    {insight.severity.replace('_', ' ')}
                  </Badge>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {insight.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {insight.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">{insight.description}</p>

                {/* Metric comparison box if provided */}
                {insight.metricComparison && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">{insight.metricComparison.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 font-bold">
                        {insight.metricComparison.currentValue}
                      </span>
                      <span className="text-slate-400">vs</span>
                      <span className="text-slate-500">
                        {insight.metricComparison.benchmarkValue}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended Action & Link */}
              {insight.recommendedAction && (
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-700">
                    <strong className="text-blue-700 font-semibold block sm:inline mr-1">
                      Action:
                    </strong>
                    {insight.recommendedAction}
                  </div>

                  <NavLink
                    to={
                      insight.category === 'opportunities'
                        ? '/clips'
                        : insight.category === 'actions'
                        ? '/settings'
                        : '/ai-studio'
                    }
                  >
                    <Button variant="secondary" size="sm" className="shrink-0">
                      {t('intelligence.applyInsight')}
                    </Button>
                  </NavLink>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default CreatorIntelligencePage;

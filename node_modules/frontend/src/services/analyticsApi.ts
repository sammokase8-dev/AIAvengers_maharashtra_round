import apiClient from '../api/client';
import {
  MetricSummary,
  TimeSeriesPoint,
  PlatformMetric,
  ContentPerformanceItem,
  CreatorInsight,
} from '../types';

export interface AnalyticsDashboardData {
  isDemoData?: boolean;
  demoNotice?: string;
  metrics: {
    views: MetricSummary;
    engagementRate: MetricSummary;
    watchTimeHours: MetricSummary;
    totalPublished: MetricSummary;
    saves: MetricSummary;
    shares: MetricSummary;
  };
  timeSeries: TimeSeriesPoint[];
  platformBreakdown: PlatformMetric[];
  topContent: ContentPerformanceItem[];
  retentionCurve: Array<{ second: number; percentage: number }>;
}

export const analyticsApi = {
  getDashboardAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AnalyticsDashboardData> {
    return apiClient.get<AnalyticsDashboardData>('/analytics/dashboard', { range: timeRange });
  },

  getCreatorInsights(): Promise<CreatorInsight[]> {
    return apiClient.get<CreatorInsight[]>('/intelligence/insights');
  },
};
export default analyticsApi;

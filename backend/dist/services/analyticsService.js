"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const memoryStore_js_1 = require("../db/memoryStore.js");
const metricChange = (current, previous) => {
    if (previous <= 0)
        return {};
    const changePercent = Math.round(((current - previous) / previous) * 1000) / 10;
    return { changePercent, isPositive: changePercent >= 0 };
};
class AnalyticsService {
    static async getDashboardAnalytics(userId, range = '30d') {
        const rawSnapshots = memoryStore_js_1.memoryStore.analytics.get(userId) || [];
        const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30;
        const cutoff = Date.now() - days * 86400000;
        const snapshots = rawSnapshots
            .filter((snapshot) => new Date(`${snapshot.date}T00:00:00Z`).getTime() >= cutoff)
            .sort((left, right) => left.date.localeCompare(right.date));
        const midpoint = Math.floor(snapshots.length / 2);
        const previous = snapshots.slice(0, midpoint);
        const current = snapshots.slice(midpoint);
        const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
        const totalViews = sum(snapshots, 'views');
        const totalEngagement = sum(snapshots, 'engagement');
        const engagementRate = totalViews > 0 ? Math.round((totalEngagement / totalViews) * 1000) / 10 : 0;
        const previousViews = sum(previous, 'views');
        const previousEngagement = sum(previous, 'engagement');
        const previousEngagementRate = previousViews > 0 ? (previousEngagement / previousViews) * 100 : 0;
        const totalWatchTime = sum(snapshots, 'watchTimeHours');
        const publishedCount = Array.from(memoryStore_js_1.memoryStore.schedules.values())
            .filter((schedule) => schedule.userId === userId && schedule.status === 'published').length;
        const isDemoData = userId === 'usr_demo_01';
        return {
            isDemoData,
            demoNotice: isDemoData
                ? 'DEMO DATA — analytics below are seeded sample snapshots, not synced from social networks.'
                : undefined,
            metrics: {
                views: {
                    label: 'Views',
                    value: totalViews.toLocaleString(),
                    ...metricChange(sum(current, 'views'), previousViews),
                },
                engagementRate: {
                    label: 'Engagement Rate',
                    value: `${engagementRate}%`,
                    ...metricChange(current.length ? (sum(current, 'engagement') / Math.max(1, sum(current, 'views'))) * 100 : 0, previousEngagementRate),
                },
                watchTimeHours: {
                    label: 'Watch Time',
                    value: `${totalWatchTime.toLocaleString()} hrs`,
                    ...metricChange(sum(current, 'watchTimeHours'), sum(previous, 'watchTimeHours')),
                },
                totalPublished: { label: 'Published Content', value: publishedCount },
                saves: { label: 'Saves', value: 'Not tracked' },
                shares: {
                    label: 'Shares',
                    value: sum(snapshots, 'shares').toLocaleString(),
                    ...metricChange(sum(current, 'shares'), sum(previous, 'shares')),
                },
            },
            timeSeries: snapshots.map((snapshot) => ({
                date: snapshot.date,
                views: snapshot.views,
                engagement: snapshot.engagement,
                watchTimeHours: snapshot.watchTimeHours,
            })),
            platformBreakdown: [],
            topContent: [],
            retentionCurve: [],
            dataSource: isDemoData ? 'demo' : 'internal_snapshots',
        };
    }
}
exports.AnalyticsService = AnalyticsService;
exports.default = AnalyticsService;

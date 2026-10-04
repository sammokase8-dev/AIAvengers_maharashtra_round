import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { AnalyticsService } from '../services/analyticsService.js';

export const analyticsRoutes = Router();

// GET /api/analytics/dashboard
analyticsRoutes.get('/dashboard', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.id || 'usr_demo_01';
    const range = (req.query.range as string) || '30d';
    const data = await AnalyticsService.getDashboardAnalytics(userId, range);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default analyticsRoutes;

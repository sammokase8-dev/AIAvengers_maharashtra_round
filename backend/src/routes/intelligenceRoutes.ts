import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { IntelligenceService } from '../services/intelligenceService.js';
import { AppError } from '../middleware/errorHandler.js';

export const intelligenceRoutes = Router();

// GET /api/intelligence/insights
intelligenceRoutes.get('/insights', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.id || 'usr_demo_01';
    const insights = await IntelligenceService.getInsights(userId);
    res.json({ success: true, data: insights });
  } catch (err) {
    next(err);
  }
});

// POST /api/intelligence/insights/:id/dismiss
intelligenceRoutes.post('/insights/:id/dismiss', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const dismissed = await IntelligenceService.dismissInsight(req.params.id as string, req.user?.id || 'usr_demo_01');
    if (!dismissed) {
      return next(new AppError('Insight not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, message: 'Insight dismissed' });
  } catch (err) {
    next(err);
  }
});

export default intelligenceRoutes;

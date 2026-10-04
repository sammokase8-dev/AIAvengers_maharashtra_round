import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { SearchService } from '../services/searchService.js';

export const searchRoutes = Router();

// GET /api/search?q=query
searchRoutes.get('/', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const q = (req.query.q as string) || '';
    const userId = req.user?.id || 'usr_demo_01';
    const results = await SearchService.searchAll(q, userId);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

export default searchRoutes;

import { Router, Request, Response } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { AuthService } from '../services/authService.js';
import { memoryStore } from '../db/memoryStore.js';

export const creatorRoutes = Router();

creatorRoutes.get('/profile', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.id || 'usr_demo_01';
    const profile = await AuthService.getProfile(userId);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

creatorRoutes.put('/profile', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const profile = Array.from(memoryStore.profiles.values()).find((p) => p.userId === userId);
    if (profile) {
      if (req.body.channelName) profile.channelName = req.body.channelName;
      if (req.body.niche) profile.niche = req.body.niche;
      if (req.body.bio) profile.bio = req.body.bio;
      if (req.body.languagePreference) profile.languagePreference = req.body.languagePreference;
      profile.updatedAt = new Date().toISOString();
    }
    const updated = await AuthService.getProfile(userId);
    res.json({ success: true, data: updated, message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
});

export default creatorRoutes;

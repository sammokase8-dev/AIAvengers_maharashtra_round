import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { PublishingService } from '../services/publishingService.js';
import { memoryStore, PlatformAdaptationRecord, TimelineRecord } from '../db/memoryStore.js';
import { JobQueueService } from '../services/jobQueueService.js';
import { AppError } from '../middleware/errorHandler.js';
import { VideoService } from '../services/videoService.js';

export const platformsRoutes = Router();
const adaptationForUser = (platform: string, userId: string) =>
  memoryStore.adaptations.get(`${userId}_${platform}`) || memoryStore.adaptations.get(platform);

// GET /api/platforms/connections
platformsRoutes.get('/connections', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || 'usr_demo_01';
    const connections = await PublishingService.getConnections(userId);
    res.json({ success: true, data: connections });
  } catch (err) {
    next(err);
  }
});

// POST /api/platforms/toggle
platformsRoutes.post('/toggle', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || 'usr_demo_01';
    const { platform, connect, accountHandle } = req.body;
    if (typeof platform !== 'string' || typeof connect !== 'boolean' ||
        (accountHandle !== undefined && (typeof accountHandle !== 'string' || accountHandle.length > 200))) {
      throw new AppError('Platform and boolean connection state are required.', 400, 'BAD_REQUEST');
    }

    const updated = await PublishingService.toggleConnection(userId, platform, !!connect, accountHandle);
    res.json({
      success: true,
      data: updated,
      message: `${platform} connection ${connect ? 'enabled' : 'disconnected'}`,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/platforms/adaptations OR /api/platform/adaptations
platformsRoutes.get('/adaptations', optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id || 'usr_demo_01';
  const { projectId } = req.query;
  if (typeof projectId === 'string' && memoryStore.projects.get(projectId)?.userId !== userId) {
    return next(new AppError('Project not found', 404, 'NOT_FOUND'));
  }
  const adaptationsByPlatform = new Map<string, PlatformAdaptationRecord>();
  Array.from(memoryStore.adaptations.values())
    .filter((adaptation) => !adaptation.userId || adaptation.userId === userId)
    .forEach((adaptation) => adaptationsByPlatform.set(adaptation.platform, adaptation));
  let adaptations = Array.from(adaptationsByPlatform.values());
  if (projectId && typeof projectId === 'string') {
    adaptations = adaptations.filter((a) => !a.projectId || a.projectId === projectId);
  }
  res.json({ success: true, data: adaptations });
});

// PATCH /api/platforms/adaptations/:platform OR /api/platform/adaptations/:platform
platformsRoutes.patch('/adaptations/:platform', optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const { platform } = req.params;
  if (typeof platform !== 'string') {
    return next(new AppError('Invalid platform', 400, 'BAD_REQUEST'));
  }
  const userId = req.user?.id || 'usr_demo_01';
  const current = adaptationForUser(platform, userId);
  if (!current) {
    return next(new AppError(`Adaptation for ${platform} not found`, 404, 'NOT_FOUND'));
  }

  const updates = req.body;
  if ((updates.title !== undefined && (typeof updates.title !== 'string' || updates.title.length > 300)) ||
      (updates.description !== undefined && (typeof updates.description !== 'string' || updates.description.length > 5000)) ||
      (updates.aspectRatio !== undefined && !['16:9', '9:16', '1:1', '4:5'].includes(updates.aspectRatio)) ||
      (updates.hashtags !== undefined && (!Array.isArray(updates.hashtags) || !updates.hashtags.every((tag: unknown) => typeof tag === 'string' && tag.length <= 100))) ||
      (updates.ctaText !== undefined && (typeof updates.ctaText !== 'string' || updates.ctaText.length > 500)) ||
      (updates.captionStyle !== undefined && (typeof updates.captionStyle !== 'string' || updates.captionStyle.length > 80))) {
    return next(new AppError('Platform adaptation values are invalid.', 400, 'BAD_REQUEST'));
  }
  const updated = {
    ...current,
    id: `${current.id}_${userId}`,
    userId,
    title: updates.title ?? current.title,
    description: updates.description ?? current.description,
    aspectRatio: updates.aspectRatio ?? current.aspectRatio,
    hashtags: updates.hashtags ?? current.hashtags,
    ctaText: updates.ctaText ?? current.ctaText,
    captionStyle: updates.captionStyle ?? current.captionStyle,
    updatedAt: new Date().toISOString(),
  };
  memoryStore.adaptations.set(`${userId}_${platform}`, updated);
  res.json({ success: true, data: updated, message: `${platform} adaptation updated` });
});

// POST /api/platforms/adaptations/:platform/export OR /api/platform/adaptations/:platform/export
platformsRoutes.post('/adaptations/:platform/export', optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const { platform } = req.params;
  if (typeof platform !== 'string') {
    return next(new AppError('Invalid platform', 400, 'BAD_REQUEST'));
  }
  const userId = req.user?.id || 'usr_demo_01';
  const projectId = req.body.projectId;
  if (typeof projectId !== 'string' || memoryStore.projects.get(projectId)?.userId !== userId) {
    return next(new AppError('Project not found', 404, 'NOT_FOUND'));
  }
  const adaptation = adaptationForUser(platform, userId);
  const timeline = memoryStore.timelines.get(projectId);
  const aspectRatio = adaptation?.aspectRatio;
  if (!timeline?.clips.length) {
    return next(new AppError('Add and save timeline clips before exporting a platform variant.', 409, 'EMPTY_TIMELINE'));
  }
  if (!adaptation || typeof aspectRatio !== 'string' || !['16:9', '9:16', '1:1', '4:5'].includes(aspectRatio)) {
    return next(new AppError('No valid aspect-ratio preset exists for this platform.', 422, 'PRESET_UNAVAILABLE'));
  }

  const job = JobQueueService.createJob(
    userId,
    'rendering',
    `Exporting ${platform.toUpperCase()} Optimized Video`,
    async (updateProgress) => {
      const result = await VideoService.renderTimeline(
        { ...timeline, aspectRatio: aspectRatio as TimelineRecord['aspectRatio'] },
        updateProgress,
        userId,
        '1080p',
        false
      );
      const storedAdaptation = {
        ...adaptation,
        id: `${adaptation.id}_${userId}`,
        userId,
        status: 'exported' as const,
        outputUrl: result.outputUrl,
        updatedAt: new Date().toISOString(),
      };
      memoryStore.adaptations.set(`${userId}_${platform}`, storedAdaptation);
      return { resultUrl: result.outputUrl };
    }
  );

  res.status(202).json({
    success: true,
    data: {
      id: job.id,
      jobId: job.id,
      type: job.type,
      title: job.title,
      status: job.status,
      progress: job.progress,
      message: 'Applying aspect ratio framing and burn-in caption styles...',
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
  });
});

export default platformsRoutes;

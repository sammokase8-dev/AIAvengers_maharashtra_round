import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { PublishingService } from '../services/publishingService.js';
import { memoryStore } from '../db/memoryStore.js';
import { AppError } from '../middleware/errorHandler.js';

export const publishingRoutes = Router();

// GET /api/publishing/scheduled OR /api/publishing/posts
publishingRoutes.get(['/scheduled', '/posts'], optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || 'usr_demo_01';
    const { status, platform } = req.query;
    let posts = await PublishingService.getScheduledPosts(userId);

    if (status && typeof status === 'string') {
      posts = posts.filter((p) => p.status === status);
    }
    if (platform && typeof platform === 'string') {
      posts = posts.filter((p) => p.platforms.includes(platform));
    }

    res.json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
});

// POST /api/publishing/schedule
publishingRoutes.post('/schedule', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || 'usr_demo_01';
    const { title, description, platforms, scheduledTime, projectId, mediaUrl, thumbnailUrl } = req.body;

    if (typeof title !== 'string' || typeof scheduledTime !== 'string' ||
        !Array.isArray(platforms) || !platforms.every((platform) => typeof platform === 'string') ||
        (description !== undefined && typeof description !== 'string') ||
        (projectId !== undefined && typeof projectId !== 'string') ||
        (mediaUrl !== undefined && typeof mediaUrl !== 'string') ||
        (thumbnailUrl !== undefined && typeof thumbnailUrl !== 'string')) {
      throw new AppError('Title, target platforms, and scheduledTime are required and must be valid.', 400, 'BAD_REQUEST');
    }

    const scheduled = await PublishingService.schedulePost(userId, {
      title,
      description,
      platforms,
      scheduledTime,
      projectId,
      mediaUrl,
      thumbnailUrl,
    });

    res.status(201).json({
      success: true,
      data: scheduled,
      message: 'Saved to the CreatorAI schedule. External publishing requires a configured platform connection.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/publishing/publish-now/:id OR /api/publishing/posts/:id/publish-now
publishingRoutes.post(['/publish-now/:id', '/posts/:id/publish-now'], optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || 'usr_demo_01';
    const result = await PublishingService.publishNow(userId, req.params.id as string);
    res.json({
      success: true,
      data: result.schedule,
      message: 'Published successfully to connected networks',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/publishing/posts/:id/retry
publishingRoutes.post('/posts/:id/retry', optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const post = memoryStore.schedules.get(req.params.id as string);
  if (!post || post.userId !== (req.user?.id || 'usr_demo_01')) {
    return next(new AppError('Scheduled post not found', 404, 'NOT_FOUND'));
  }
  return next(new AppError('Publishing cannot be retried until the selected platform adapter is configured.', 503, 'PLATFORM_NOT_CONFIGURED'));
});

// PATCH /api/publishing/posts/:id/reschedule
publishingRoutes.patch('/posts/:id/reschedule', optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const post = memoryStore.schedules.get(req.params.id as string);
  if (!post || post.userId !== (req.user?.id || 'usr_demo_01')) {
    return next(new AppError('Scheduled post not found', 404, 'NOT_FOUND'));
  }
  const { scheduledTime } = req.body;
  if (typeof scheduledTime !== 'string' || !Number.isFinite(Date.parse(scheduledTime)) || Date.parse(scheduledTime) <= Date.now()) {
    return next(new AppError('New scheduledTime is required', 400, 'BAD_REQUEST'));
  }
  post.scheduledTime = scheduledTime;
  post.status = 'scheduled';
  post.updatedAt = new Date().toISOString();
  memoryStore.schedules.set(post.id, post);
  res.json({ success: true, data: post, message: 'Post rescheduled successfully' });
});

// DELETE /api/publishing/scheduled/:id OR /api/publishing/posts/:id
publishingRoutes.delete(['/scheduled/:id', '/posts/:id'], optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const scheduleId = req.params.id as string;
  const post = memoryStore.schedules.get(scheduleId);
  if (!post || post.userId !== (req.user?.id || 'usr_demo_01')) {
    return next(new AppError('Scheduled post not found', 404, 'NOT_FOUND'));
  }
  memoryStore.schedules.delete(scheduleId);
  res.json({ success: true, message: 'Scheduled post removed' });
});

export default publishingRoutes;

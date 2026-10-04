import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { ClipService } from '../services/clipService.js';
import { JobQueueService } from '../services/jobQueueService.js';
import { AppError } from '../middleware/errorHandler.js';

export const clipsRoutes = Router();

// GET /api/clips
clipsRoutes.get('/', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const { projectId, status } = req.query;
    const clips = await ClipService.getClips({
      projectId: projectId as string,
      status: status as string,
    }, req.user?.id || 'usr_demo_01');
    res.json({ success: true, data: clips });
  } catch (err) {
    next(err);
  }
});

// POST /api/clips/generate
clipsRoutes.post('/generate', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const { sourceAssetId, projectId, guidanceText, targetCount } = req.body;
    const userId = req.user?.id || 'usr_demo_01';
    if (typeof sourceAssetId !== 'string' || sourceAssetId.length > 100) {
      throw new AppError('A valid source asset ID is required.', 400, 'BAD_REQUEST');
    }
    if (targetCount !== undefined && (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 10)) {
      throw new AppError('Clip count must be between 1 and 10.', 400, 'BAD_REQUEST');
    }

    const job = JobQueueService.createJob(
      userId,
      'clip_generation',
      'Transcript-Based Clip Candidate Selection',
      async (updateProgress) => {
        updateProgress(25, 'Validating source transcript timestamps');
        const clips = await ClipService.generateClips({
          sourceAssetId,
          projectId: typeof projectId === 'string' ? projectId : undefined,
          guidanceText: typeof guidanceText === 'string' ? guidanceText.slice(0, 2000) : undefined,
          targetCount,
        }, userId);
        updateProgress(90, `Saved ${clips.length} complete-thought clip candidates`);
        return { resultUrl: '/clips' };
      }
    );

    res.status(202).json({
      success: true,
      data: {
        id: job.id,
        type: job.type,
        title: job.title,
        status: job.status,
        progress: job.progress,
        message: 'Queued transcript-based clip candidate selection.',
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
      jobId: job.id,
      message: 'Clip selection queued using transcript sentence boundaries.',
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/clips/:id/status
clipsRoutes.patch('/:id/status', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected', 'in_editor'].includes(status)) {
      throw new AppError('Invalid clip status', 400, 'BAD_REQUEST');
    }
    const updated = await ClipService.updateClipStatus(req.params.id as string, status, req.user?.id || 'usr_demo_01');
    res.json({ success: true, data: updated, message: `Clip marked as ${status}` });
  } catch (err) {
    next(err);
  }
});

// POST /api/clips/:id/regenerate-hook
clipsRoutes.post('/:id/regenerate-hook', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const { style } = req.body;
    const updated = await ClipService.regenerateClipHook(req.params.id as string, style, req.user?.id || 'usr_demo_01');
    res.json({ success: true, data: updated, message: 'Hook regenerated successfully' });
  } catch (err) {
    next(err);
  }
});

export default clipsRoutes;

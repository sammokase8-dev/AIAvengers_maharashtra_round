import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { JobQueueService } from '../services/jobQueueService.js';
import { memoryStore } from '../db/memoryStore.js';
import { AppError } from '../middleware/errorHandler.js';

export const jobsRoutes = Router();

// GET /api/jobs/active
jobsRoutes.get('/active', optionalAuth, (req: Request, res: Response) => {
  const userId = req.user?.id || 'usr_demo_01';
  const jobs = JobQueueService.getJobs(userId).filter(
    (j) => j.status === 'queued' || j.status === 'processing'
  );
  res.json({ success: true, data: jobs });
});

// GET /api/jobs
jobsRoutes.get('/', optionalAuth, (req: Request, res: Response) => {
  const userId = req.user?.id || 'usr_demo_01';
  const jobs = JobQueueService.getJobs(userId);
  res.json({ success: true, data: jobs });
});

// GET /api/jobs/:id
jobsRoutes.get('/:id', optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const job = memoryStore.jobs.get(req.params.id as string);
  if (!job || job.userId !== (req.user?.id || 'usr_demo_01')) {
    return next(new AppError('Job not found', 404, 'NOT_FOUND'));
  }
  res.json({ success: true, data: job });
});

// POST /api/jobs/:id/retry
jobsRoutes.post('/:id/retry', optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = JobQueueService.retryJob(req.params.id as string, req.user?.id || 'usr_demo_01');
    res.status(202).json({ success: true, data: job, message: 'Job retry queued' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/jobs/:id
jobsRoutes.delete('/:id', optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    JobQueueService.dismissJob(req.params.id as string, req.user?.id || 'usr_demo_01');
    res.json({ success: true, message: 'Job dismissed' });
  } catch (error) {
    next(error);
  }
});

export default jobsRoutes;

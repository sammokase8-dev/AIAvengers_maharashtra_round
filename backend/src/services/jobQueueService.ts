import { v4 as uuidv4 } from 'uuid';
import { memoryStore, JobRecord } from '../db/memoryStore.js';
import { SocketService } from './socketService.js';
import { AppError } from '../middleware/errorHandler.js';

export type JobType =
  | 'video_upload'
  | 'transcription'
  | 'video_analysis'
  | 'clip_generation'
  | 'rendering'
  | 'ai_generation'
  | 'publish';

export class JobQueueService {
  private static readonly executors = new Map<string, (updateProgress: (p: number, msg?: string) => void) => Promise<{ resultUrl?: string }>>();

  private static enqueue(job: JobRecord, executeAsync: (updateProgress: (p: number, msg?: string) => void) => Promise<{ resultUrl?: string }>): void {
    setImmediate(async () => {
      try {
        job.status = 'processing';
        job.progress = 10;
        job.updatedAt = new Date().toISOString();
        SocketService.broadcastJobUpdate(job);

        const updateProgress = (progress: number, message?: string) => {
          job.progress = Math.min(99, Math.max(job.progress, progress));
          if (message) job.message = message;
          job.updatedAt = new Date().toISOString();
          SocketService.broadcastJobUpdate(job);
        };
        const result = await executeAsync(updateProgress);
        job.status = 'completed';
        job.progress = 100;
        job.resultUrl = result?.resultUrl;
        job.updatedAt = new Date().toISOString();
        SocketService.broadcastJobUpdate(job);

        const notification = {
          id: `notif_${uuidv4().substring(0, 6)}`,
          userId: job.userId,
          title: `${job.title} Completed`,
          message: `Your background task "${job.title}" has finished successfully.`,
          type: 'success' as const,
          actionUrl: result?.resultUrl || '/dashboard',
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        memoryStore.notifications.set(notification.id, notification);
        SocketService.sendNotification(job.userId, notification);
      } catch (error: unknown) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Job processing failed';
        job.updatedAt = new Date().toISOString();
        SocketService.broadcastJobUpdate(job);
        const notification = {
          id: `notif_${uuidv4().substring(0, 6)}`,
          userId: job.userId,
          title: `${job.title} Failed`,
          message: job.error,
          type: 'error' as const,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        memoryStore.notifications.set(notification.id, notification);
        SocketService.sendNotification(job.userId, notification);
      }
    });
  }

  public static createJob(
    userId: string,
    type: JobType,
    title: string,
    executeAsync: (updateProgress: (p: number, msg?: string) => void) => Promise<{ resultUrl?: string }>
  ): JobRecord {
    const job: JobRecord = {
      id: `job_${uuidv4().substring(0, 8)}`,
      userId,
      type,
      title,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryStore.jobs.set(job.id, job);
    this.executors.set(job.id, executeAsync);
    SocketService.broadcastJobUpdate(job);
    this.enqueue(job, executeAsync);
    return job;
  }

  public static retryJob(jobId: string, userId: string): JobRecord {
    const job = memoryStore.jobs.get(jobId);
    const executor = this.executors.get(jobId);
    if (!job || job.userId !== userId) throw new AppError('Job not found.', 404, 'NOT_FOUND');
    if (job.status !== 'failed') throw new AppError('Only failed jobs can be retried.', 409, 'JOB_NOT_RETRYABLE');
    if (!executor) throw new AppError('This job can no longer be retried because its worker is unavailable.', 503, 'JOB_RETRY_UNAVAILABLE');
    job.status = 'queued';
    job.progress = 0;
    job.error = undefined;
    job.message = 'Retry queued.';
    job.updatedAt = new Date().toISOString();
    this.enqueue(job, executor);
    return job;
  }

  public static dismissJob(jobId: string, userId: string): void {
    const job = memoryStore.jobs.get(jobId);
    if (!job || job.userId !== userId) throw new AppError('Job not found.', 404, 'NOT_FOUND');
    if (job.status === 'processing' || job.status === 'queued') {
      throw new AppError('An active job cannot be dismissed.', 409, 'JOB_ACTIVE');
    }
    memoryStore.jobs.delete(jobId);
    this.executors.delete(jobId);
  }

  public static getJobs(userId: string): JobRecord[] {
    return Array.from(memoryStore.jobs.values()).filter((j) => j.userId === userId);
  }
}
export default JobQueueService;

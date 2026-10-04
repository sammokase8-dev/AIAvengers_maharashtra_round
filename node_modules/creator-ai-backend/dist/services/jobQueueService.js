"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueueService = void 0;
const uuid_1 = require("uuid");
const memoryStore_js_1 = require("../db/memoryStore.js");
const socketService_js_1 = require("./socketService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
class JobQueueService {
    static executors = new Map();
    static enqueue(job, executeAsync) {
        setImmediate(async () => {
            try {
                job.status = 'processing';
                job.progress = 10;
                job.updatedAt = new Date().toISOString();
                socketService_js_1.SocketService.broadcastJobUpdate(job);
                const updateProgress = (progress, message) => {
                    job.progress = Math.min(99, Math.max(job.progress, progress));
                    if (message)
                        job.message = message;
                    job.updatedAt = new Date().toISOString();
                    socketService_js_1.SocketService.broadcastJobUpdate(job);
                };
                const result = await executeAsync(updateProgress);
                job.status = 'completed';
                job.progress = 100;
                job.resultUrl = result?.resultUrl;
                job.updatedAt = new Date().toISOString();
                socketService_js_1.SocketService.broadcastJobUpdate(job);
                const notification = {
                    id: `notif_${(0, uuid_1.v4)().substring(0, 6)}`,
                    userId: job.userId,
                    title: `${job.title} Completed`,
                    message: `Your background task "${job.title}" has finished successfully.`,
                    type: 'success',
                    actionUrl: result?.resultUrl || '/dashboard',
                    isRead: false,
                    createdAt: new Date().toISOString(),
                };
                memoryStore_js_1.memoryStore.notifications.set(notification.id, notification);
                socketService_js_1.SocketService.sendNotification(job.userId, notification);
            }
            catch (error) {
                job.status = 'failed';
                job.error = error instanceof Error ? error.message : 'Job processing failed';
                job.updatedAt = new Date().toISOString();
                socketService_js_1.SocketService.broadcastJobUpdate(job);
                const notification = {
                    id: `notif_${(0, uuid_1.v4)().substring(0, 6)}`,
                    userId: job.userId,
                    title: `${job.title} Failed`,
                    message: job.error,
                    type: 'error',
                    isRead: false,
                    createdAt: new Date().toISOString(),
                };
                memoryStore_js_1.memoryStore.notifications.set(notification.id, notification);
                socketService_js_1.SocketService.sendNotification(job.userId, notification);
            }
        });
    }
    static createJob(userId, type, title, executeAsync) {
        const job = {
            id: `job_${(0, uuid_1.v4)().substring(0, 8)}`,
            userId,
            type,
            title,
            status: 'queued',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        memoryStore_js_1.memoryStore.jobs.set(job.id, job);
        this.executors.set(job.id, executeAsync);
        socketService_js_1.SocketService.broadcastJobUpdate(job);
        this.enqueue(job, executeAsync);
        return job;
    }
    static retryJob(jobId, userId) {
        const job = memoryStore_js_1.memoryStore.jobs.get(jobId);
        const executor = this.executors.get(jobId);
        if (!job || job.userId !== userId)
            throw new errorHandler_js_1.AppError('Job not found.', 404, 'NOT_FOUND');
        if (job.status !== 'failed')
            throw new errorHandler_js_1.AppError('Only failed jobs can be retried.', 409, 'JOB_NOT_RETRYABLE');
        if (!executor)
            throw new errorHandler_js_1.AppError('This job can no longer be retried because its worker is unavailable.', 503, 'JOB_RETRY_UNAVAILABLE');
        job.status = 'queued';
        job.progress = 0;
        job.error = undefined;
        job.message = 'Retry queued.';
        job.updatedAt = new Date().toISOString();
        this.enqueue(job, executor);
        return job;
    }
    static dismissJob(jobId, userId) {
        const job = memoryStore_js_1.memoryStore.jobs.get(jobId);
        if (!job || job.userId !== userId)
            throw new errorHandler_js_1.AppError('Job not found.', 404, 'NOT_FOUND');
        if (job.status === 'processing' || job.status === 'queued') {
            throw new errorHandler_js_1.AppError('An active job cannot be dismissed.', 409, 'JOB_ACTIVE');
        }
        memoryStore_js_1.memoryStore.jobs.delete(jobId);
        this.executors.delete(jobId);
    }
    static getJobs(userId) {
        return Array.from(memoryStore_js_1.memoryStore.jobs.values()).filter((j) => j.userId === userId);
    }
}
exports.JobQueueService = JobQueueService;
exports.default = JobQueueService;

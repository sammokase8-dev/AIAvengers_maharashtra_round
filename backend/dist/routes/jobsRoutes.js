"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const jobQueueService_js_1 = require("../services/jobQueueService.js");
const memoryStore_js_1 = require("../db/memoryStore.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
exports.jobsRoutes = (0, express_1.Router)();
// GET /api/jobs/active
exports.jobsRoutes.get('/active', auth_js_1.optionalAuth, (req, res) => {
    const userId = req.user?.id || 'usr_demo_01';
    const jobs = jobQueueService_js_1.JobQueueService.getJobs(userId).filter((j) => j.status === 'queued' || j.status === 'processing');
    res.json({ success: true, data: jobs });
});
// GET /api/jobs
exports.jobsRoutes.get('/', auth_js_1.optionalAuth, (req, res) => {
    const userId = req.user?.id || 'usr_demo_01';
    const jobs = jobQueueService_js_1.JobQueueService.getJobs(userId);
    res.json({ success: true, data: jobs });
});
// GET /api/jobs/:id
exports.jobsRoutes.get('/:id', auth_js_1.optionalAuth, (req, res, next) => {
    const job = memoryStore_js_1.memoryStore.jobs.get(req.params.id);
    if (!job || job.userId !== (req.user?.id || 'usr_demo_01')) {
        return next(new errorHandler_js_1.AppError('Job not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: job });
});
// POST /api/jobs/:id/retry
exports.jobsRoutes.post('/:id/retry', auth_js_1.optionalAuth, (req, res, next) => {
    try {
        const job = jobQueueService_js_1.JobQueueService.retryJob(req.params.id, req.user?.id || 'usr_demo_01');
        res.status(202).json({ success: true, data: job, message: 'Job retry queued' });
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/jobs/:id
exports.jobsRoutes.delete('/:id', auth_js_1.optionalAuth, (req, res, next) => {
    try {
        jobQueueService_js_1.JobQueueService.dismissJob(req.params.id, req.user?.id || 'usr_demo_01');
        res.json({ success: true, message: 'Job dismissed' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = exports.jobsRoutes;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishingRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const publishingService_js_1 = require("../services/publishingService.js");
const memoryStore_js_1 = require("../db/memoryStore.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
exports.publishingRoutes = (0, express_1.Router)();
// GET /api/publishing/scheduled OR /api/publishing/posts
exports.publishingRoutes.get(['/scheduled', '/posts'], auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id || 'usr_demo_01';
        const { status, platform } = req.query;
        let posts = await publishingService_js_1.PublishingService.getScheduledPosts(userId);
        if (status && typeof status === 'string') {
            posts = posts.filter((p) => p.status === status);
        }
        if (platform && typeof platform === 'string') {
            posts = posts.filter((p) => p.platforms.includes(platform));
        }
        res.json({ success: true, data: posts });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/publishing/schedule
exports.publishingRoutes.post('/schedule', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id || 'usr_demo_01';
        const { title, description, platforms, scheduledTime, projectId, mediaUrl, thumbnailUrl } = req.body;
        if (typeof title !== 'string' || typeof scheduledTime !== 'string' ||
            !Array.isArray(platforms) || !platforms.every((platform) => typeof platform === 'string') ||
            (description !== undefined && typeof description !== 'string') ||
            (projectId !== undefined && typeof projectId !== 'string') ||
            (mediaUrl !== undefined && typeof mediaUrl !== 'string') ||
            (thumbnailUrl !== undefined && typeof thumbnailUrl !== 'string')) {
            throw new errorHandler_js_1.AppError('Title, target platforms, and scheduledTime are required and must be valid.', 400, 'BAD_REQUEST');
        }
        const scheduled = await publishingService_js_1.PublishingService.schedulePost(userId, {
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
    }
    catch (err) {
        next(err);
    }
});
// POST /api/publishing/publish-now/:id OR /api/publishing/posts/:id/publish-now
exports.publishingRoutes.post(['/publish-now/:id', '/posts/:id/publish-now'], auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id || 'usr_demo_01';
        const result = await publishingService_js_1.PublishingService.publishNow(userId, req.params.id);
        res.json({
            success: true,
            data: result.schedule,
            message: 'Published successfully to connected networks',
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/publishing/posts/:id/retry
exports.publishingRoutes.post('/posts/:id/retry', auth_js_1.optionalAuth, (req, res, next) => {
    const post = memoryStore_js_1.memoryStore.schedules.get(req.params.id);
    if (!post || post.userId !== (req.user?.id || 'usr_demo_01')) {
        return next(new errorHandler_js_1.AppError('Scheduled post not found', 404, 'NOT_FOUND'));
    }
    return next(new errorHandler_js_1.AppError('Publishing cannot be retried until the selected platform adapter is configured.', 503, 'PLATFORM_NOT_CONFIGURED'));
});
// PATCH /api/publishing/posts/:id/reschedule
exports.publishingRoutes.patch('/posts/:id/reschedule', auth_js_1.optionalAuth, (req, res, next) => {
    const post = memoryStore_js_1.memoryStore.schedules.get(req.params.id);
    if (!post || post.userId !== (req.user?.id || 'usr_demo_01')) {
        return next(new errorHandler_js_1.AppError('Scheduled post not found', 404, 'NOT_FOUND'));
    }
    const { scheduledTime } = req.body;
    if (typeof scheduledTime !== 'string' || !Number.isFinite(Date.parse(scheduledTime)) || Date.parse(scheduledTime) <= Date.now()) {
        return next(new errorHandler_js_1.AppError('New scheduledTime is required', 400, 'BAD_REQUEST'));
    }
    post.scheduledTime = scheduledTime;
    post.status = 'scheduled';
    post.updatedAt = new Date().toISOString();
    memoryStore_js_1.memoryStore.schedules.set(post.id, post);
    res.json({ success: true, data: post, message: 'Post rescheduled successfully' });
});
// DELETE /api/publishing/scheduled/:id OR /api/publishing/posts/:id
exports.publishingRoutes.delete(['/scheduled/:id', '/posts/:id'], auth_js_1.optionalAuth, (req, res, next) => {
    const scheduleId = req.params.id;
    const post = memoryStore_js_1.memoryStore.schedules.get(scheduleId);
    if (!post || post.userId !== (req.user?.id || 'usr_demo_01')) {
        return next(new errorHandler_js_1.AppError('Scheduled post not found', 404, 'NOT_FOUND'));
    }
    memoryStore_js_1.memoryStore.schedules.delete(scheduleId);
    res.json({ success: true, message: 'Scheduled post removed' });
});
exports.default = exports.publishingRoutes;

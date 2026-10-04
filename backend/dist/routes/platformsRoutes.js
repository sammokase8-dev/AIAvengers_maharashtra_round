"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformsRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const publishingService_js_1 = require("../services/publishingService.js");
const memoryStore_js_1 = require("../db/memoryStore.js");
const jobQueueService_js_1 = require("../services/jobQueueService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const videoService_js_1 = require("../services/videoService.js");
exports.platformsRoutes = (0, express_1.Router)();
const adaptationForUser = (platform, userId) => memoryStore_js_1.memoryStore.adaptations.get(`${userId}_${platform}`) || memoryStore_js_1.memoryStore.adaptations.get(platform);
// GET /api/platforms/connections
exports.platformsRoutes.get('/connections', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id || 'usr_demo_01';
        const connections = await publishingService_js_1.PublishingService.getConnections(userId);
        res.json({ success: true, data: connections });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/platforms/toggle
exports.platformsRoutes.post('/toggle', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id || 'usr_demo_01';
        const { platform, connect, accountHandle } = req.body;
        if (typeof platform !== 'string' || typeof connect !== 'boolean' ||
            (accountHandle !== undefined && (typeof accountHandle !== 'string' || accountHandle.length > 200))) {
            throw new errorHandler_js_1.AppError('Platform and boolean connection state are required.', 400, 'BAD_REQUEST');
        }
        const updated = await publishingService_js_1.PublishingService.toggleConnection(userId, platform, !!connect, accountHandle);
        res.json({
            success: true,
            data: updated,
            message: `${platform} connection ${connect ? 'enabled' : 'disconnected'}`,
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/platforms/adaptations OR /api/platform/adaptations
exports.platformsRoutes.get('/adaptations', auth_js_1.optionalAuth, (req, res, next) => {
    const userId = req.user?.id || 'usr_demo_01';
    const { projectId } = req.query;
    if (typeof projectId === 'string' && memoryStore_js_1.memoryStore.projects.get(projectId)?.userId !== userId) {
        return next(new errorHandler_js_1.AppError('Project not found', 404, 'NOT_FOUND'));
    }
    const adaptationsByPlatform = new Map();
    Array.from(memoryStore_js_1.memoryStore.adaptations.values())
        .filter((adaptation) => !adaptation.userId || adaptation.userId === userId)
        .forEach((adaptation) => adaptationsByPlatform.set(adaptation.platform, adaptation));
    let adaptations = Array.from(adaptationsByPlatform.values());
    if (projectId && typeof projectId === 'string') {
        adaptations = adaptations.filter((a) => !a.projectId || a.projectId === projectId);
    }
    res.json({ success: true, data: adaptations });
});
// PATCH /api/platforms/adaptations/:platform OR /api/platform/adaptations/:platform
exports.platformsRoutes.patch('/adaptations/:platform', auth_js_1.optionalAuth, (req, res, next) => {
    const { platform } = req.params;
    if (typeof platform !== 'string') {
        return next(new errorHandler_js_1.AppError('Invalid platform', 400, 'BAD_REQUEST'));
    }
    const userId = req.user?.id || 'usr_demo_01';
    const current = adaptationForUser(platform, userId);
    if (!current) {
        return next(new errorHandler_js_1.AppError(`Adaptation for ${platform} not found`, 404, 'NOT_FOUND'));
    }
    const updates = req.body;
    if ((updates.title !== undefined && (typeof updates.title !== 'string' || updates.title.length > 300)) ||
        (updates.description !== undefined && (typeof updates.description !== 'string' || updates.description.length > 5000)) ||
        (updates.aspectRatio !== undefined && !['16:9', '9:16', '1:1', '4:5'].includes(updates.aspectRatio)) ||
        (updates.hashtags !== undefined && (!Array.isArray(updates.hashtags) || !updates.hashtags.every((tag) => typeof tag === 'string' && tag.length <= 100))) ||
        (updates.ctaText !== undefined && (typeof updates.ctaText !== 'string' || updates.ctaText.length > 500)) ||
        (updates.captionStyle !== undefined && (typeof updates.captionStyle !== 'string' || updates.captionStyle.length > 80))) {
        return next(new errorHandler_js_1.AppError('Platform adaptation values are invalid.', 400, 'BAD_REQUEST'));
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
    memoryStore_js_1.memoryStore.adaptations.set(`${userId}_${platform}`, updated);
    res.json({ success: true, data: updated, message: `${platform} adaptation updated` });
});
// POST /api/platforms/adaptations/:platform/export OR /api/platform/adaptations/:platform/export
exports.platformsRoutes.post('/adaptations/:platform/export', auth_js_1.optionalAuth, (req, res, next) => {
    const { platform } = req.params;
    if (typeof platform !== 'string') {
        return next(new errorHandler_js_1.AppError('Invalid platform', 400, 'BAD_REQUEST'));
    }
    const userId = req.user?.id || 'usr_demo_01';
    const projectId = req.body.projectId;
    if (typeof projectId !== 'string' || memoryStore_js_1.memoryStore.projects.get(projectId)?.userId !== userId) {
        return next(new errorHandler_js_1.AppError('Project not found', 404, 'NOT_FOUND'));
    }
    const adaptation = adaptationForUser(platform, userId);
    const timeline = memoryStore_js_1.memoryStore.timelines.get(projectId);
    const aspectRatio = adaptation?.aspectRatio;
    if (!timeline?.clips.length) {
        return next(new errorHandler_js_1.AppError('Add and save timeline clips before exporting a platform variant.', 409, 'EMPTY_TIMELINE'));
    }
    if (!adaptation || typeof aspectRatio !== 'string' || !['16:9', '9:16', '1:1', '4:5'].includes(aspectRatio)) {
        return next(new errorHandler_js_1.AppError('No valid aspect-ratio preset exists for this platform.', 422, 'PRESET_UNAVAILABLE'));
    }
    const job = jobQueueService_js_1.JobQueueService.createJob(userId, 'rendering', `Exporting ${platform.toUpperCase()} Optimized Video`, async (updateProgress) => {
        const result = await videoService_js_1.VideoService.renderTimeline({ ...timeline, aspectRatio: aspectRatio }, updateProgress, userId, '1080p', false);
        const storedAdaptation = {
            ...adaptation,
            id: `${adaptation.id}_${userId}`,
            userId,
            status: 'exported',
            outputUrl: result.outputUrl,
            updatedAt: new Date().toISOString(),
        };
        memoryStore_js_1.memoryStore.adaptations.set(`${userId}_${platform}`, storedAdaptation);
        return { resultUrl: result.outputUrl };
    });
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
exports.default = exports.platformsRoutes;

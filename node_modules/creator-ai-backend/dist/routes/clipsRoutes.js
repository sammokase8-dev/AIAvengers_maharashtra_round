"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clipsRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const clipService_js_1 = require("../services/clipService.js");
const jobQueueService_js_1 = require("../services/jobQueueService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
exports.clipsRoutes = (0, express_1.Router)();
// GET /api/clips
exports.clipsRoutes.get('/', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const { projectId, status } = req.query;
        const clips = await clipService_js_1.ClipService.getClips({
            projectId: projectId,
            status: status,
        }, req.user?.id || 'usr_demo_01');
        res.json({ success: true, data: clips });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/clips/generate
exports.clipsRoutes.post('/generate', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const { sourceAssetId, projectId, guidanceText, targetCount } = req.body;
        const userId = req.user?.id || 'usr_demo_01';
        if (typeof sourceAssetId !== 'string' || sourceAssetId.length > 100) {
            throw new errorHandler_js_1.AppError('A valid source asset ID is required.', 400, 'BAD_REQUEST');
        }
        if (targetCount !== undefined && (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 10)) {
            throw new errorHandler_js_1.AppError('Clip count must be between 1 and 10.', 400, 'BAD_REQUEST');
        }
        const job = jobQueueService_js_1.JobQueueService.createJob(userId, 'clip_generation', 'Transcript-Based Clip Candidate Selection', async (updateProgress) => {
            updateProgress(25, 'Validating source transcript timestamps');
            const clips = await clipService_js_1.ClipService.generateClips({
                sourceAssetId,
                projectId: typeof projectId === 'string' ? projectId : undefined,
                guidanceText: typeof guidanceText === 'string' ? guidanceText.slice(0, 2000) : undefined,
                targetCount,
            }, userId);
            updateProgress(90, `Saved ${clips.length} complete-thought clip candidates`);
            return { resultUrl: '/clips' };
        });
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
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/clips/:id/status
exports.clipsRoutes.patch('/:id/status', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['accepted', 'rejected', 'in_editor'].includes(status)) {
            throw new errorHandler_js_1.AppError('Invalid clip status', 400, 'BAD_REQUEST');
        }
        const updated = await clipService_js_1.ClipService.updateClipStatus(req.params.id, status, req.user?.id || 'usr_demo_01');
        res.json({ success: true, data: updated, message: `Clip marked as ${status}` });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/clips/:id/regenerate-hook
exports.clipsRoutes.post('/:id/regenerate-hook', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const { style } = req.body;
        const updated = await clipService_js_1.ClipService.regenerateClipHook(req.params.id, style, req.user?.id || 'usr_demo_01');
        res.json({ success: true, data: updated, message: 'Hook regenerated successfully' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = exports.clipsRoutes;

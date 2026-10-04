"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const memoryStore_js_1 = require("../db/memoryStore.js");
const videoService_js_1 = require("../services/videoService.js");
const scriptMatchingService_js_1 = require("../services/scriptMatchingService.js");
const transcriptionService_js_1 = require("../services/transcriptionService.js");
const jobQueueService_js_1 = require("../services/jobQueueService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const zod_1 = require("zod");
exports.videoRoutes = (0, express_1.Router)();
const timelineSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    projectId: zod_1.z.string().min(1),
    aspectRatio: zod_1.z.enum(['16:9', '9:16', '1:1', '4:5']),
    totalDuration: zod_1.z.number().min(0).max(36000),
    clips: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1),
        sourceAssetId: zod_1.z.string().min(1),
        sourceAssetName: zod_1.z.string(),
        sourceUrl: zod_1.z.string(),
        startTime: zod_1.z.number().nonnegative(),
        endTime: zod_1.z.number().positive(),
        timelineStart: zod_1.z.number().nonnegative(),
        speed: zod_1.z.number().min(0.5).max(2),
        volume: zod_1.z.number().min(0).max(2),
        trackIndex: zod_1.z.number().int().min(0).max(2),
        crop: zod_1.z.unknown().optional(),
    })).max(500),
    captionTrack: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1),
        startTime: zod_1.z.number().nonnegative(),
        endTime: zod_1.z.number().positive(),
        text: zod_1.z.string().max(5000),
    })).max(5000),
    overlays: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1),
        type: zod_1.z.enum(['text', 'image', 'sticker']),
        content: zod_1.z.string().max(1000),
        startTime: zod_1.z.number().nonnegative(),
        endTime: zod_1.z.number().positive(),
        x: zod_1.z.number().min(0).max(100),
        y: zod_1.z.number().min(0).max(100),
        style: zod_1.z.object({
            fontSize: zod_1.z.number().optional(),
            color: zod_1.z.string().optional(),
        }).optional(),
    })).max(500),
    audioTrack: zod_1.z.object({
        assetId: zod_1.z.string().optional(),
        volume: zod_1.z.number().min(0).max(2),
        fadeIn: zod_1.z.number().nonnegative().optional(),
        fadeOut: zod_1.z.number().nonnegative().optional(),
    }).optional(),
    lastSavedAt: zod_1.z.string().optional(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
// GET /api/video/timeline/:projectId OR /api/video/projects/:projectId/timeline
exports.videoRoutes.get(['/timeline/:projectId', '/projects/:projectId/timeline'], auth_js_1.optionalAuth, (req, res, next) => {
    const projectId = req.params.projectId;
    const userId = req.user?.id || 'usr_demo_01';
    if (memoryStore_js_1.memoryStore.projects.get(projectId)?.userId !== userId) {
        return next(new errorHandler_js_1.AppError('Project not found', 404, 'NOT_FOUND'));
    }
    const timeline = memoryStore_js_1.memoryStore.timelines.get(projectId);
    if (timeline) {
        return res.json({ success: true, data: timeline });
    }
    const emptyTimeline = {
        id: `tml_${projectId}`,
        projectId,
        aspectRatio: '16:9',
        totalDuration: 0,
        clips: [],
        captionTrack: [],
        overlays: [],
        lastSavedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    memoryStore_js_1.memoryStore.timelines.set(projectId, emptyTimeline);
    res.json({ success: true, data: emptyTimeline });
});
// POST & PUT /api/video/timeline/:projectId OR /api/video/projects/:projectId/timeline
const saveTimelineHandler = (req, res, next) => {
    const projectId = req.params.projectId;
    const userId = req.user?.id || 'usr_demo_01';
    if (memoryStore_js_1.memoryStore.projects.get(projectId)?.userId !== userId) {
        return next(new errorHandler_js_1.AppError('Project not found', 404, 'NOT_FOUND'));
    }
    const parsed = timelineSchema.safeParse({ ...req.body, projectId });
    if (!parsed.success)
        return next(new errorHandler_js_1.AppError('Timeline data is invalid.', 400, 'BAD_REQUEST', parsed.error.flatten()));
    const incoming = parsed.data;
    if (incoming.clips.some((clip) => memoryStore_js_1.memoryStore.assets.get(clip.sourceAssetId)?.userId !== userId)) {
        return next(new errorHandler_js_1.AppError('A timeline source asset was not found.', 404, 'ASSET_NOT_FOUND'));
    }
    if (incoming.audioTrack?.assetId && memoryStore_js_1.memoryStore.assets.get(incoming.audioTrack.assetId)?.userId !== userId) {
        return next(new errorHandler_js_1.AppError('The timeline audio asset was not found.', 404, 'ASSET_NOT_FOUND'));
    }
    const updatedTimeline = {
        id: incoming.id || `tml_${projectId}`,
        projectId,
        aspectRatio: incoming.aspectRatio,
        totalDuration: incoming.totalDuration,
        clips: incoming.clips,
        captionTrack: incoming.captionTrack,
        overlays: incoming.overlays,
        audioTrack: incoming.audioTrack,
        lastSavedAt: new Date().toISOString(),
        createdAt: incoming.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    memoryStore_js_1.memoryStore.timelines.set(projectId, updatedTimeline);
    res.json({ success: true, data: updatedTimeline, lastSavedAt: updatedTimeline.lastSavedAt, message: 'Timeline saved successfully' });
};
exports.videoRoutes.post(['/timeline/:projectId', '/projects/:projectId/timeline'], auth_js_1.optionalAuth, saveTimelineHandler);
exports.videoRoutes.put(['/timeline/:projectId', '/projects/:projectId/timeline'], auth_js_1.optionalAuth, saveTimelineHandler);
// POST /api/video/render OR /api/video/projects/:projectId/render
exports.videoRoutes.post(['/render', '/projects/:projectId/render'], auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const { timeline, preset, exportFormat } = req.body;
        const projectId = (req.params.projectId || timeline?.projectId);
        const userId = req.user?.id || 'usr_demo_01';
        if (memoryStore_js_1.memoryStore.projects.get(projectId)?.userId !== userId) {
            throw new errorHandler_js_1.AppError('Project not found', 404, 'NOT_FOUND');
        }
        const submittedTimeline = timeline || memoryStore_js_1.memoryStore.timelines.get(projectId);
        const parsed = timelineSchema.safeParse(submittedTimeline);
        const targetTimeline = parsed.success ? parsed.data : undefined;
        if (!targetTimeline) {
            throw new errorHandler_js_1.AppError('A valid timeline is required for rendering.', 400, 'BAD_REQUEST', parsed.success ? undefined : parsed.error.flatten());
        }
        if (targetTimeline.projectId !== projectId)
            throw new errorHandler_js_1.AppError('Timeline project does not match the render request.', 400, 'BAD_REQUEST');
        const resolution = exportFormat?.resolution || preset || '1080p';
        if (!['1080p', '4k'].includes(resolution))
            throw new errorHandler_js_1.AppError('Resolution must be 1080p or 4k.', 400, 'BAD_REQUEST');
        // Start background render job
        const job = jobQueueService_js_1.JobQueueService.createJob(userId, 'rendering', `Hardware Render (${targetTimeline.aspectRatio || '16:9'}) - ${resolution}`, async (updateProgress) => {
            const result = await videoService_js_1.VideoService.renderTimeline(targetTimeline, updateProgress, userId, resolution);
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
                message: 'Rendering task queued. Real-time updates active via WebSocket.',
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/video/align-script
exports.videoRoutes.post('/align-script', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const { projectId = 'prj_01', scriptText } = req.body;
        if (typeof scriptText !== 'string' || scriptText.trim().length === 0 || scriptText.length > 20000) {
            throw new errorHandler_js_1.AppError('Script text is required and must be under 20,000 characters.', 400, 'BAD_REQUEST');
        }
        if (memoryStore_js_1.memoryStore.projects.get(projectId)?.userId !== (req.user?.id || 'usr_demo_01'))
            throw new errorHandler_js_1.AppError('Project not found.', 404, 'NOT_FOUND');
        const result = await scriptMatchingService_js_1.ScriptMatchingService.matchScriptToVideo(projectId, scriptText);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/video/transcript/:assetId
exports.videoRoutes.get('/transcript/:assetId', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const asset = memoryStore_js_1.memoryStore.assets.get(req.params.assetId);
        if (!asset || asset.userId !== (req.user?.id || 'usr_demo_01'))
            throw new errorHandler_js_1.AppError('Asset not found.', 404, 'NOT_FOUND');
        const transcript = await transcriptionService_js_1.TranscriptionService.getTranscriptForAsset(asset.id);
        res.json({ success: true, data: transcript });
    }
    catch (err) {
        next(err);
    }
});
exports.videoRoutes.post('/transcript/:assetId/generate', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const asset = memoryStore_js_1.memoryStore.assets.get(req.params.assetId);
        const userId = req.user?.id || 'usr_demo_01';
        if (!asset || asset.userId !== userId || asset.type !== 'video')
            throw new errorHandler_js_1.AppError('Video asset not found.', 404, 'NOT_FOUND');
        if (!Array.from(memoryStore_js_1.memoryStore.transcripts.values()).some((transcript) => transcript.assetId === asset.id)) {
            const job = jobQueueService_js_1.JobQueueService.createJob(userId, 'transcription', `Transcribing ${asset.name}`, async (updateProgress) => {
                updateProgress(15, 'Extracting audio from the original video');
                const transcript = await transcriptionService_js_1.TranscriptionService.transcribeAsset(asset.id);
                updateProgress(95, `Saved ${transcript.segments.length} timestamped transcript segments`);
                return { resultUrl: `/assets/${asset.id}` };
            });
            return res.status(202).json({
                success: true,
                data: {
                    id: job.id,
                    type: job.type,
                    title: job.title,
                    status: job.status,
                    progress: job.progress,
                    createdAt: job.createdAt,
                    updatedAt: job.updatedAt,
                },
            });
        }
        throw new errorHandler_js_1.AppError('A timestamped transcript already exists for this asset.', 409, 'TRANSCRIPT_EXISTS');
    }
    catch (err) {
        next(err);
    }
});
exports.default = exports.videoRoutes;

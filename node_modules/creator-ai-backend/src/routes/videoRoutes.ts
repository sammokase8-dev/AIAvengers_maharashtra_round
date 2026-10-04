import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { memoryStore, TimelineRecord } from '../db/memoryStore.js';
import { VideoService } from '../services/videoService.js';
import { ScriptMatchingService } from '../services/scriptMatchingService.js';
import { TranscriptionService } from '../services/transcriptionService.js';
import { JobQueueService } from '../services/jobQueueService.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export const videoRoutes = Router();

const timelineSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5']),
  totalDuration: z.number().min(0).max(36000),
  clips: z.array(z.object({
    id: z.string().min(1),
    sourceAssetId: z.string().min(1),
    sourceAssetName: z.string(),
    sourceUrl: z.string(),
    startTime: z.number().nonnegative(),
    endTime: z.number().positive(),
    timelineStart: z.number().nonnegative(),
    speed: z.number().min(0.5).max(2),
    volume: z.number().min(0).max(2),
    trackIndex: z.number().int().min(0).max(2),
    crop: z.unknown().optional(),
  })).max(500),
  captionTrack: z.array(z.object({
    id: z.string().min(1),
    startTime: z.number().nonnegative(),
    endTime: z.number().positive(),
    text: z.string().max(5000),
  })).max(5000),
  overlays: z.array(z.object({
    id: z.string().min(1),
    type: z.enum(['text', 'image', 'sticker']),
    content: z.string().max(1000),
    startTime: z.number().nonnegative(),
    endTime: z.number().positive(),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    style: z.object({
      fontSize: z.number().optional(),
      color: z.string().optional(),
    }).optional(),
  })).max(500),
  audioTrack: z.object({
    assetId: z.string().optional(),
    volume: z.number().min(0).max(2),
    fadeIn: z.number().nonnegative().optional(),
    fadeOut: z.number().nonnegative().optional(),
  }).optional(),
  lastSavedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// GET /api/video/timeline/:projectId OR /api/video/projects/:projectId/timeline
videoRoutes.get(['/timeline/:projectId', '/projects/:projectId/timeline'], optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const projectId = req.params.projectId as string;
  const userId = req.user?.id || 'usr_demo_01';
  if (memoryStore.projects.get(projectId)?.userId !== userId) {
    return next(new AppError('Project not found', 404, 'NOT_FOUND'));
  }
  const timeline = memoryStore.timelines.get(projectId);

  if (timeline) {
    return res.json({ success: true, data: timeline });
  }

  const emptyTimeline: TimelineRecord = {
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

  memoryStore.timelines.set(projectId, emptyTimeline);
  res.json({ success: true, data: emptyTimeline });
});

// POST & PUT /api/video/timeline/:projectId OR /api/video/projects/:projectId/timeline
const saveTimelineHandler = (req: Request, res: Response, next: NextFunction) => {
  const projectId = req.params.projectId as string;
  const userId = req.user?.id || 'usr_demo_01';
  if (memoryStore.projects.get(projectId)?.userId !== userId) {
    return next(new AppError('Project not found', 404, 'NOT_FOUND'));
  }
  const parsed = timelineSchema.safeParse({ ...req.body, projectId });
  if (!parsed.success) return next(new AppError('Timeline data is invalid.', 400, 'BAD_REQUEST', parsed.error.flatten()));
  const incoming = parsed.data;
  if (incoming.clips.some((clip) => memoryStore.assets.get(clip.sourceAssetId)?.userId !== userId)) {
    return next(new AppError('A timeline source asset was not found.', 404, 'ASSET_NOT_FOUND'));
  }
  if (incoming.audioTrack?.assetId && memoryStore.assets.get(incoming.audioTrack.assetId)?.userId !== userId) {
    return next(new AppError('The timeline audio asset was not found.', 404, 'ASSET_NOT_FOUND'));
  }

  const updatedTimeline: TimelineRecord = {
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

  memoryStore.timelines.set(projectId, updatedTimeline);
  res.json({ success: true, data: updatedTimeline, lastSavedAt: updatedTimeline.lastSavedAt, message: 'Timeline saved successfully' });
};

videoRoutes.post(['/timeline/:projectId', '/projects/:projectId/timeline'], optionalAuth, saveTimelineHandler);
videoRoutes.put(['/timeline/:projectId', '/projects/:projectId/timeline'], optionalAuth, saveTimelineHandler);

// POST /api/video/render OR /api/video/projects/:projectId/render
videoRoutes.post(['/render', '/projects/:projectId/render'], optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { timeline, preset, exportFormat } = req.body;
    const projectId = (req.params.projectId || timeline?.projectId) as string;
    const userId = req.user?.id || 'usr_demo_01';
    if (memoryStore.projects.get(projectId)?.userId !== userId) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }
    const submittedTimeline = timeline || memoryStore.timelines.get(projectId);
    const parsed = timelineSchema.safeParse(submittedTimeline);
    const targetTimeline = parsed.success ? parsed.data as TimelineRecord : undefined;
    if (!targetTimeline) {
      throw new AppError('A valid timeline is required for rendering.', 400, 'BAD_REQUEST', parsed.success ? undefined : parsed.error.flatten());
    }
    if (targetTimeline.projectId !== projectId) throw new AppError('Timeline project does not match the render request.', 400, 'BAD_REQUEST');
    const resolution = exportFormat?.resolution || preset || '1080p';
    if (!['1080p', '4k'].includes(resolution)) throw new AppError('Resolution must be 1080p or 4k.', 400, 'BAD_REQUEST');

    // Start background render job
    const job = JobQueueService.createJob(
      userId,
      'rendering',
      `Hardware Render (${targetTimeline.aspectRatio || '16:9'}) - ${resolution}`,
      async (updateProgress) => {
        const result = await VideoService.renderTimeline(targetTimeline, updateProgress, userId, resolution);
        return { resultUrl: result.outputUrl };
      }
    );

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
  } catch (err) {
    next(err);
  }
});

// POST /api/video/align-script
videoRoutes.post('/align-script', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId = 'prj_01', scriptText } = req.body;
    if (typeof scriptText !== 'string' || scriptText.trim().length === 0 || scriptText.length > 20000) {
      throw new AppError('Script text is required and must be under 20,000 characters.', 400, 'BAD_REQUEST');
    }
    if (memoryStore.projects.get(projectId)?.userId !== (req.user?.id || 'usr_demo_01')) throw new AppError('Project not found.', 404, 'NOT_FOUND');

    const result = await ScriptMatchingService.matchScriptToVideo(projectId, scriptText);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/video/transcript/:assetId
videoRoutes.get('/transcript/:assetId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = memoryStore.assets.get(req.params.assetId as string);
    if (!asset || asset.userId !== (req.user?.id || 'usr_demo_01')) throw new AppError('Asset not found.', 404, 'NOT_FOUND');
    const transcript = await TranscriptionService.getTranscriptForAsset(asset.id);
    res.json({ success: true, data: transcript });
  } catch (err) {
    next(err);
  }
});

videoRoutes.post('/transcript/:assetId/generate', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = memoryStore.assets.get(req.params.assetId as string);
    const userId = req.user?.id || 'usr_demo_01';
    if (!asset || asset.userId !== userId || asset.type !== 'video') throw new AppError('Video asset not found.', 404, 'NOT_FOUND');
    if (!Array.from(memoryStore.transcripts.values()).some((transcript) => transcript.assetId === asset.id)) {
      const job = JobQueueService.createJob(userId, 'transcription', `Transcribing ${asset.name}`, async (updateProgress) => {
        updateProgress(15, 'Extracting audio from the original video');
        const transcript = await TranscriptionService.transcribeAsset(asset.id);
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
    throw new AppError('A timestamped transcript already exists for this asset.', 409, 'TRANSCRIPT_EXISTS');
  } catch (err) {
    next(err);
  }
});

export default videoRoutes;

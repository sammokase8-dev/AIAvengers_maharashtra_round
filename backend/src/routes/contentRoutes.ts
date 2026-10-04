import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { memoryStore, ContentProjectRecord, ScriptRecord } from '../db/memoryStore.js';
import { ScriptMatchingService } from '../services/scriptMatchingService.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export const contentRoutes = Router();

// GET /api/content/projects OR /api/projects
contentRoutes.get(['/projects', '/'], optionalAuth, (req: Request, res: Response) => {
  const userId = req.user?.id || 'usr_demo_01';
  const { status } = req.query;
  let projects = Array.from(memoryStore.projects.values()).filter((project) => project.userId === userId);
  if (status && typeof status === 'string') {
    projects = projects.filter((p) => p.status === status);
  }
  res.json({ success: true, data: projects });
});

// GET /api/content/projects/:id/script-match OR /api/projects/:id/script-match
contentRoutes.get(['/projects/:id/script-match', '/:id/script-match'], optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id as string;
    const project = memoryStore.projects.get(projectId);
    if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
      return next(new AppError('Project not found', 404, 'NOT_FOUND'));
    }
    const matchResult = await ScriptMatchingService.getProjectMatches(projectId);
    res.json({ success: true, data: matchResult });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/content/projects/:id/script-match/:matchId OR /api/projects/:id/script-match/:matchId
contentRoutes.patch(['/projects/:id/script-match/:matchId', '/:id/script-match/:matchId'], optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const project = memoryStore.projects.get(req.params.id as string);
  if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
    return next(new AppError('Project not found', 404, 'NOT_FOUND'));
  }
  const { matchId } = req.params;
  const { status, startTime, endTime } = req.body;
  if (!['accepted', 'rejected', 'manual_adjusted'].includes(status)) {
    return next(new AppError('Invalid footage approval status.', 400, 'BAD_REQUEST'));
  }
  if ((startTime !== undefined && typeof startTime !== 'number') ||
      (endTime !== undefined && typeof endTime !== 'number')) {
    return next(new AppError('Match timestamps must be numbers.', 400, 'BAD_REQUEST'));
  }
  const result = ScriptMatchingService.updateMatchStatus(req.params.id as string, matchId as string, status, startTime, endTime);
  res.json({ success: true, data: result, message: 'Script match status updated' });
});

// GET /api/content/projects/:id OR /api/projects/:id
contentRoutes.get(['/projects/:id', '/:id'], optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const projectId = req.params.id as string;
  const project = memoryStore.projects.get(projectId);
  if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
    return next(new AppError('Project not found', 404, 'NOT_FOUND'));
  }
  res.json({ success: true, data: project });
});

// POST /api/content/projects OR /api/projects
contentRoutes.post(['/projects', '/'], optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id || 'usr_demo_01';
  const { title, description, niche, targetPlatforms = ['youtube'], tags = [] } = req.body;

  if (!title || !title.trim()) {
    return next(new AppError('Project title is required', 400, 'BAD_REQUEST'));
  }

  const project: ContentProjectRecord = {
    id: `prj_${uuidv4().substring(0, 8)}`,
    userId,
    title: title.trim(),
    description: description || '',
    status: 'idea',
    niche: niche || 'Tech & Media',
    targetPlatforms,
    tags,
    thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.projects.set(project.id, project);
  res.status(201).json({ success: true, data: project, message: 'Project created successfully' });
});

// PATCH /api/content/projects/:id OR /api/projects/:id
contentRoutes.patch(['/projects/:id', '/:id'], optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id || 'usr_demo_01';
  const projectId = req.params.id as string;
  const project = memoryStore.projects.get(projectId);
  if (!project || project.userId !== userId) {
    return next(new AppError('Project not found', 404, 'NOT_FOUND'));
  }

  if (req.body.title) project.title = req.body.title;
  if (req.body.description !== undefined) project.description = req.body.description;
  if (req.body.status) project.status = req.body.status;
  if (req.body.niche) project.niche = req.body.niche;
  if (req.body.targetPlatforms) project.targetPlatforms = req.body.targetPlatforms;
  if (req.body.tags) project.tags = req.body.tags;
  project.updatedAt = new Date().toISOString();

  res.json({ success: true, data: project, message: 'Project updated' });
});

// DELETE /api/content/projects/:id OR /api/projects/:id
contentRoutes.delete(['/projects/:id', '/:id'], optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const projectId = req.params.id as string;
  const project = memoryStore.projects.get(projectId);
  if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
    return next(new AppError('Project not found', 404, 'NOT_FOUND'));
  }
  memoryStore.projects.delete(projectId);
  res.json({ success: true, message: 'Project deleted successfully' });
});

// GET /api/content/projects/:id/scripts OR /api/projects/:id/scripts
contentRoutes.get(['/projects/:id/scripts', '/:id/scripts'], optionalAuth, (req: Request, res: Response) => {
  const projectId = req.params.id as string;
  const project = memoryStore.projects.get(projectId);
  if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }
  const scripts = Array.from(memoryStore.scripts.values()).filter((s) => s.projectId === projectId);
  res.json({ success: true, data: scripts });
});

// POST /api/content/projects/:id/scripts OR /api/projects/:id/scripts
contentRoutes.post(['/projects/:id/scripts', '/:id/scripts'], optionalAuth, (req: Request, res: Response) => {
  const projectId = req.params.id as string;
  const project = memoryStore.projects.get(projectId);
  if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }
  const { title, rawText, tone } = req.body;
  const wordCount = (rawText || '').split(/\s+/).filter(Boolean).length;
  const script: ScriptRecord = {
    id: `scr_${uuidv4().substring(0, 8)}`,
    projectId,
    title: title || 'Production Script',
    rawText: rawText || '',
    tone: tone || 'conversational',
    wordCount,
    durationSec: Math.round((wordCount / 130) * 60),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.scripts.set(script.id, script);
  res.status(201).json({ success: true, data: script, message: 'Script saved' });
});

export default contentRoutes;

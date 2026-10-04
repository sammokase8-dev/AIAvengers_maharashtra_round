"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const memoryStore_js_1 = require("../db/memoryStore.js");
const scriptMatchingService_js_1 = require("../services/scriptMatchingService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const uuid_1 = require("uuid");
exports.contentRoutes = (0, express_1.Router)();
// GET /api/content/projects OR /api/projects
exports.contentRoutes.get(['/projects', '/'], auth_js_1.optionalAuth, (req, res) => {
    const userId = req.user?.id || 'usr_demo_01';
    const { status } = req.query;
    let projects = Array.from(memoryStore_js_1.memoryStore.projects.values()).filter((project) => project.userId === userId);
    if (status && typeof status === 'string') {
        projects = projects.filter((p) => p.status === status);
    }
    res.json({ success: true, data: projects });
});
// GET /api/content/projects/:id/script-match OR /api/projects/:id/script-match
exports.contentRoutes.get(['/projects/:id/script-match', '/:id/script-match'], auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const project = memoryStore_js_1.memoryStore.projects.get(projectId);
        if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
            return next(new errorHandler_js_1.AppError('Project not found', 404, 'NOT_FOUND'));
        }
        const matchResult = await scriptMatchingService_js_1.ScriptMatchingService.getProjectMatches(projectId);
        res.json({ success: true, data: matchResult });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/content/projects/:id/script-match/:matchId OR /api/projects/:id/script-match/:matchId
exports.contentRoutes.patch(['/projects/:id/script-match/:matchId', '/:id/script-match/:matchId'], auth_js_1.optionalAuth, (req, res, next) => {
    const project = memoryStore_js_1.memoryStore.projects.get(req.params.id);
    if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
        return next(new errorHandler_js_1.AppError('Project not found', 404, 'NOT_FOUND'));
    }
    const { matchId } = req.params;
    const { status, startTime, endTime } = req.body;
    if (!['accepted', 'rejected', 'manual_adjusted'].includes(status)) {
        return next(new errorHandler_js_1.AppError('Invalid footage approval status.', 400, 'BAD_REQUEST'));
    }
    if ((startTime !== undefined && typeof startTime !== 'number') ||
        (endTime !== undefined && typeof endTime !== 'number')) {
        return next(new errorHandler_js_1.AppError('Match timestamps must be numbers.', 400, 'BAD_REQUEST'));
    }
    const result = scriptMatchingService_js_1.ScriptMatchingService.updateMatchStatus(req.params.id, matchId, status, startTime, endTime);
    res.json({ success: true, data: result, message: 'Script match status updated' });
});
// GET /api/content/projects/:id OR /api/projects/:id
exports.contentRoutes.get(['/projects/:id', '/:id'], auth_js_1.optionalAuth, (req, res, next) => {
    const projectId = req.params.id;
    const project = memoryStore_js_1.memoryStore.projects.get(projectId);
    if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
        return next(new errorHandler_js_1.AppError('Project not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: project });
});
// POST /api/content/projects OR /api/projects
exports.contentRoutes.post(['/projects', '/'], auth_js_1.optionalAuth, (req, res, next) => {
    const userId = req.user?.id || 'usr_demo_01';
    const { title, description, niche, targetPlatforms = ['youtube'], tags = [] } = req.body;
    if (!title || !title.trim()) {
        return next(new errorHandler_js_1.AppError('Project title is required', 400, 'BAD_REQUEST'));
    }
    const project = {
        id: `prj_${(0, uuid_1.v4)().substring(0, 8)}`,
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
    memoryStore_js_1.memoryStore.projects.set(project.id, project);
    res.status(201).json({ success: true, data: project, message: 'Project created successfully' });
});
// PATCH /api/content/projects/:id OR /api/projects/:id
exports.contentRoutes.patch(['/projects/:id', '/:id'], auth_js_1.optionalAuth, (req, res, next) => {
    const userId = req.user?.id || 'usr_demo_01';
    const projectId = req.params.id;
    const project = memoryStore_js_1.memoryStore.projects.get(projectId);
    if (!project || project.userId !== userId) {
        return next(new errorHandler_js_1.AppError('Project not found', 404, 'NOT_FOUND'));
    }
    if (req.body.title)
        project.title = req.body.title;
    if (req.body.description !== undefined)
        project.description = req.body.description;
    if (req.body.status)
        project.status = req.body.status;
    if (req.body.niche)
        project.niche = req.body.niche;
    if (req.body.targetPlatforms)
        project.targetPlatforms = req.body.targetPlatforms;
    if (req.body.tags)
        project.tags = req.body.tags;
    project.updatedAt = new Date().toISOString();
    res.json({ success: true, data: project, message: 'Project updated' });
});
// DELETE /api/content/projects/:id OR /api/projects/:id
exports.contentRoutes.delete(['/projects/:id', '/:id'], auth_js_1.optionalAuth, (req, res, next) => {
    const projectId = req.params.id;
    const project = memoryStore_js_1.memoryStore.projects.get(projectId);
    if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
        return next(new errorHandler_js_1.AppError('Project not found', 404, 'NOT_FOUND'));
    }
    memoryStore_js_1.memoryStore.projects.delete(projectId);
    res.json({ success: true, message: 'Project deleted successfully' });
});
// GET /api/content/projects/:id/scripts OR /api/projects/:id/scripts
exports.contentRoutes.get(['/projects/:id/scripts', '/:id/scripts'], auth_js_1.optionalAuth, (req, res) => {
    const projectId = req.params.id;
    const project = memoryStore_js_1.memoryStore.projects.get(projectId);
    if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }
    const scripts = Array.from(memoryStore_js_1.memoryStore.scripts.values()).filter((s) => s.projectId === projectId);
    res.json({ success: true, data: scripts });
});
// POST /api/content/projects/:id/scripts OR /api/projects/:id/scripts
exports.contentRoutes.post(['/projects/:id/scripts', '/:id/scripts'], auth_js_1.optionalAuth, (req, res) => {
    const projectId = req.params.id;
    const project = memoryStore_js_1.memoryStore.projects.get(projectId);
    if (!project || project.userId !== (req.user?.id || 'usr_demo_01')) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }
    const { title, rawText, tone } = req.body;
    const wordCount = (rawText || '').split(/\s+/).filter(Boolean).length;
    const script = {
        id: `scr_${(0, uuid_1.v4)().substring(0, 8)}`,
        projectId,
        title: title || 'Production Script',
        rawText: rawText || '',
        tone: tone || 'conversational',
        wordCount,
        durationSec: Math.round((wordCount / 130) * 60),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    memoryStore_js_1.memoryStore.scripts.set(script.id, script);
    res.status(201).json({ success: true, data: script, message: 'Script saved' });
});
exports.default = exports.contentRoutes;

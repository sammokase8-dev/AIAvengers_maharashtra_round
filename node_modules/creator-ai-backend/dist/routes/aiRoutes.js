"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const geminiService_js_1 = require("../services/geminiService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const zod_1 = require("zod");
exports.aiRoutes = (0, express_1.Router)();
const generateSchema = zod_1.z.object({
    operation: zod_1.z.enum(['hook', 'script', 'caption', 'cta', 'plan', 'repurpose', 'idea']).default('script'),
    prompt: zod_1.z.string().trim().max(10000).optional(),
    tone: zod_1.z.string().trim().max(80).optional(),
    targetPlatform: zod_1.z.string().trim().max(80).optional(),
    niche: zod_1.z.string().trim().max(160).optional(),
    referenceContent: zod_1.z.string().max(20000).optional(),
});
const transformSchema = zod_1.z.object({
    action: zod_1.z.enum(['improve', 'shorten', 'expand', 'changeTone', 'change_tone', 'adapt_platform']).default('improve'),
    content: zod_1.z.string().trim().min(1).max(20000),
    targetTone: zod_1.z.string().trim().max(80).optional(),
    targetPlatform: zod_1.z.string().trim().max(80).optional(),
});
// POST /api/ai/generate
exports.aiRoutes.post('/generate', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const input = generateSchema.safeParse(req.body);
        if (!input.success) {
            throw new errorHandler_js_1.AppError('Invalid AI generation request', 400, 'VALIDATION_ERROR', input.error.flatten());
        }
        const { operation, prompt, tone, targetPlatform, niche, referenceContent } = input.data;
        if (!prompt && !referenceContent) {
            throw new errorHandler_js_1.AppError('Prompt or reference content is required', 400, 'BAD_REQUEST');
        }
        const result = await geminiService_js_1.GeminiService.generateContent({
            operation: operation || 'script',
            prompt: prompt || 'Creator Operations breakdown',
            tone,
            targetPlatform,
            niche,
            referenceContent,
        });
        res.json({
            success: true,
            data: result,
            message: 'AI content generated successfully',
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/ai/transform
exports.aiRoutes.post('/transform', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const input = transformSchema.safeParse(req.body);
        if (!input.success) {
            throw new errorHandler_js_1.AppError('Invalid AI transformation request', 400, 'VALIDATION_ERROR', input.error.flatten());
        }
        const { action, content, targetTone, targetPlatform } = input.data;
        const normalizedAction = action === 'change_tone' ? 'changeTone' : action;
        const result = await geminiService_js_1.GeminiService.transformContent(normalizedAction, content, targetTone, targetPlatform);
        res.json({
            success: true,
            data: result,
            message: `Content successfully updated with ${action}`,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = exports.aiRoutes;

import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { GeminiService } from '../services/geminiService.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export const aiRoutes = Router();
const generateSchema = z.object({
  operation: z.enum(['hook', 'script', 'caption', 'cta', 'plan', 'repurpose', 'idea']).default('script'),
  prompt: z.string().trim().max(10000).optional(),
  tone: z.string().trim().max(80).optional(),
  targetPlatform: z.string().trim().max(80).optional(),
  niche: z.string().trim().max(160).optional(),
  referenceContent: z.string().max(20000).optional(),
});
const transformSchema = z.object({
  action: z.enum(['improve', 'shorten', 'expand', 'changeTone', 'change_tone', 'adapt_platform']).default('improve'),
  content: z.string().trim().min(1).max(20000),
  targetTone: z.string().trim().max(80).optional(),
  targetPlatform: z.string().trim().max(80).optional(),
});

// POST /api/ai/generate
aiRoutes.post('/generate', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const input = generateSchema.safeParse(req.body);
    if (!input.success) {
      throw new AppError('Invalid AI generation request', 400, 'VALIDATION_ERROR', input.error.flatten());
    }
    const { operation, prompt, tone, targetPlatform, niche, referenceContent } = input.data;
    if (!prompt && !referenceContent) {
      throw new AppError('Prompt or reference content is required', 400, 'BAD_REQUEST');
    }

    const result = await GeminiService.generateContent({
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
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/transform
aiRoutes.post('/transform', optionalAuth, async (req: Request, res: Response, next) => {
  try {
    const input = transformSchema.safeParse(req.body);
    if (!input.success) {
      throw new AppError('Invalid AI transformation request', 400, 'VALIDATION_ERROR', input.error.flatten());
    }
    const { action, content, targetTone, targetPlatform } = input.data;
    const normalizedAction = action === 'change_tone' ? 'changeTone' : action;
    const result = await GeminiService.transformContent(normalizedAction, content, targetTone, targetPlatform);
    res.json({
      success: true,
      data: result,
      message: `Content successfully updated with ${action}`,
    });
  } catch (err) {
    next(err);
  }
});

export default aiRoutes;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const env_js_1 = require("../config/env.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const structuredContentSchema = zod_1.z.object({
    hook: zod_1.z.string().min(1).max(500),
    script: zod_1.z.string().min(1).max(20000),
    caption: zod_1.z.string().min(1).max(5000),
    cta: zod_1.z.string().min(1).max(1000),
    contentPlan: zod_1.z.array(zod_1.z.object({
        day: zod_1.z.number().int().positive(),
        topic: zod_1.z.string().min(1),
        format: zod_1.z.string().min(1),
        hook: zod_1.z.string().min(1),
    })).max(30),
});
class GeminiService {
    static genAI = null;
    static getClient() {
        if (!this.genAI && env_js_1.config.geminiApiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(env_js_1.config.geminiApiKey);
        }
        return this.genAI;
    }
    static async generateContent(payload) {
        const client = this.getClient();
        const tone = payload.tone || 'conversational';
        const platform = payload.targetPlatform || 'youtube';
        if (!client) {
            if (env_js_1.config.demoMode) {
                return this.generateStudioFallback(payload);
            }
            throw new errorHandler_js_1.AppError('AI generation is unavailable: GEMINI_API_KEY is not configured.', 503, 'AI_NOT_CONFIGURED');
        }
        const model = client.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { responseMimeType: 'application/json' },
        });
        const systemPrompt = `You are CreatorAI's senior content strategist.
Operation requested: ${payload.operation}
Target platform: ${platform}
Tone: ${tone}
Niche: ${payload.niche || 'Digital Tech & Media'}
User prompt / Thesis: ${payload.prompt}
${payload.referenceContent ? `Reference source:\n${payload.referenceContent}` : ''}

Return only a JSON object with these required fields:
{"hook":"...","script":"...","caption":"...","cta":"...","contentPlan":[{"day":1,"topic":"...","format":"...","hook":"..."}]}
For non-plan operations, contentPlan must be an empty array. Tailor the requested operation without inventing factual performance claims.`;
        const result = await model.generateContent(systemPrompt);
        let decoded;
        try {
            decoded = JSON.parse(result.response.text());
        }
        catch {
            throw new errorHandler_js_1.AppError('AI provider returned invalid JSON instead of the required content structure.', 502, 'AI_INVALID_RESPONSE');
        }
        const parsed = structuredContentSchema.safeParse(decoded);
        if (!parsed.success) {
            throw new errorHandler_js_1.AppError('AI provider returned output that did not match the required content schema.', 502, 'AI_INVALID_RESPONSE');
        }
        const words = parsed.data.script.trim().split(/\s+/).filter(Boolean).length;
        return {
            id: `ai_${(0, crypto_1.randomUUID)()}`,
            operation: payload.operation,
            ...parsed.data,
            tone,
            platform,
            wordCount: words,
            estimatedDurationSeconds: Math.round((words / 140) * 60),
            createdAt: new Date().toISOString(),
            isDemoData: false,
        };
    }
    static async transformContent(action, content, targetTone, targetPlatform) {
        const client = this.getClient();
        if (client) {
            const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const prompt = `Perform the following editing task: ${action.toUpperCase()}
Target Tone: ${targetTone || 'engaging and punchy'}
Target Platform: ${targetPlatform || 'unspecified'}
Input text:
"${content}"

Provide the revised version directly without intro or conversational padding.`;
            const res = await model.generateContent(prompt);
            return { transformedContent: res.response.text().trim(), isDemoData: false };
        }
        if (!env_js_1.config.demoMode) {
            throw new errorHandler_js_1.AppError('AI transformation is unavailable: GEMINI_API_KEY is not configured.', 503, 'AI_NOT_CONFIGURED');
        }
        // Smart fallback transformation
        if (action === 'shorten') {
            const sentences = content.split('. ');
            const shortened = sentences.slice(0, Math.max(1, Math.floor(sentences.length / 2))).join('. ') + '.';
            return { transformedContent: shortened, isDemoData: true };
        }
        else if (action === 'expand') {
            return {
                transformedContent: `${content}\n\nHere is why this matters: most creators focus on superficial aesthetics instead of audience retention mechanics. When you reverse-engineer the first three seconds, everything else compounds.`,
                isDemoData: true,
            };
        }
        else if (action === 'changeTone') {
            return {
                transformedContent: `[Adjusted to ${targetTone || 'viral'} tone]: ${content.replace(/Artificial intelligence/gi, 'Next-gen AI')}`,
                isDemoData: true,
            };
        }
        else if (action === 'adapt_platform') {
            return {
                transformedContent: `[DEMO adaptation for ${targetPlatform || 'selected platform'}]\n${content}`,
                isDemoData: true,
            };
        }
        return {
            transformedContent: `[Refined for higher retention]: ${content}\n\nKey Takeaway: Hook the audience immediately with an unsolved curiosity loop.`,
            isDemoData: true,
        };
    }
    static generateStudioFallback(payload) {
        const topic = payload.prompt || 'How AI Is Revolutionizing Creative Operations';
        const tone = payload.tone || 'conversational';
        const platform = payload.targetPlatform || 'youtube';
        let hook = `Most creators think ${topic} is hard. Here is what they are doing wrong in the first 3 seconds.`;
        let script = `[00:00 - 00:04 Hook]
Most creators think ${topic} takes weeks. But here is the uncomfortable truth: you are wasting 80% of your time on manual tasks.

[00:04 - 00:15 The Problem]
Every day, production teams scrub through hours of footage looking for that one single soundbite. They re-export, re-render, and lose momentum.

[00:15 - 00:30 The Solution]
With non-destructive timeline operations, your cuts stay synchronized with spoken transcripts. If you change a word, the cut adjusts automatically.

[00:30 - 00:45 Call to Action]
Stop manual editing. Switch your content pipeline to structured creator operations today.`;
        let caption = `Why ${topic} will redefine content production in 2026.\n\nKey points:\n1. Non-destructive timeline synchronization\n2. Real-time spoken transcript matching\n3. One-click 9:16 vertical extraction\n\n#CreatorAI #VideoEditing #AIStudio #ContentStrategy`;
        let cta = 'Save this post and drop a comment below with your current editing bottleneck!';
        let plan = [
            { day: 1, topic: `${topic}: The Core Breakdown`, format: '16:9 Long-Form', hook: 'The biggest lie you were told about editing...' },
            { day: 3, topic: '3 Fast Wins for Non-Destructive Cuts', format: '9:16 Reel', hook: 'If you still edit like this in 2026, stop.' },
            { day: 5, topic: 'Behind The Scenes: Media Architecture', format: 'Carousel / Thread', hook: 'How we process 4K video using FFmpeg and WebSockets.' },
            { day: 7, topic: 'Weekly Q&A & Retrospective', format: 'Community Post', hook: 'What feature should we build next?' },
        ];
        if (payload.operation === 'hook') {
            hook = `Stop scrolling: the biggest mistake creators make with ${topic} in 2026.`;
        }
        const words = script.split(/\s+/).filter(Boolean).length;
        return {
            id: `ai_${Date.now()}`,
            operation: payload.operation,
            hook,
            script,
            caption,
            cta,
            contentPlan: payload.operation === 'plan' ? plan : undefined,
            tone,
            platform,
            wordCount: words,
            estimatedDurationSeconds: 45,
            createdAt: new Date().toISOString(),
            isDemoData: true,
            demoNotice: 'DEMO OUTPUT — configure GEMINI_API_KEY to generate content using Gemini.',
        };
    }
}
exports.GeminiService = GeminiService;
exports.default = GeminiService;

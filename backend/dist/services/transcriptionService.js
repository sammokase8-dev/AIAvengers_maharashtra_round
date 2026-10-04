"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptionService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const memoryStore_js_1 = require("../db/memoryStore.js");
const env_js_1 = require("../config/env.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const mediaPath_js_1 = require("./mediaPath.js");
const transcriptSchema = zod_1.z.object({
    language: zod_1.z.string().min(2).max(24),
    segments: zod_1.z.array(zod_1.z.object({
        startTime: zod_1.z.number().nonnegative(),
        endTime: zod_1.z.number().positive(),
        text: zod_1.z.string().trim().min(1).max(2000),
        confidence: zod_1.z.number().min(0).max(1),
    })).min(1).max(5000),
});
class TranscriptionService {
    static async getTranscriptForAsset(assetId) {
        return Array.from(memoryStore_js_1.memoryStore.transcripts.values()).find((transcript) => transcript.assetId === assetId) || null;
    }
    static async transcribeAsset(assetId) {
        const asset = memoryStore_js_1.memoryStore.assets.get(assetId);
        if (!asset || asset.type !== 'video') {
            throw new errorHandler_js_1.AppError('Video asset not found', 404, 'ASSET_NOT_FOUND');
        }
        if (!env_js_1.config.geminiApiKey) {
            throw new errorHandler_js_1.AppError('Transcription requires GEMINI_API_KEY. No transcript has been fabricated.', 503, 'AI_NOT_CONFIGURED');
        }
        const videoPath = (0, mediaPath_js_1.resolveLocalMediaPath)(asset.url);
        const uploadDir = path_1.default.resolve(env_js_1.config.localStorageDir);
        const audioPath = path_1.default.join(uploadDir, `transcript-${(0, uuid_1.v4)()}.mp3`);
        try {
            await this.extractAudio(videoPath, audioPath);
            const stat = await fs_1.default.promises.stat(audioPath);
            if (stat.size > 14 * 1024 * 1024) {
                throw new errorHandler_js_1.AppError('Extracted audio exceeds the Gemini inline-transcription limit. Split the source into shorter segments.', 413, 'AUDIO_TOO_LARGE');
            }
            const audioData = (await fs_1.default.promises.readFile(audioPath)).toString('base64');
            const client = new generative_ai_1.GoogleGenerativeAI(env_js_1.config.geminiApiKey);
            const model = client.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: { responseMimeType: 'application/json' },
            });
            const response = await model.generateContent([
                {
                    inlineData: {
                        mimeType: 'audio/mpeg',
                        data: audioData,
                    },
                },
                {
                    text: `Transcribe the complete audio. Return only JSON matching {"language":"en","segments":[{"startTime":0.0,"endTime":2.4,"text":"spoken sentence","confidence":0.9}]}. Times must be seconds from the beginning of the audio; provide one segment per complete sentence and never invent speech.`,
                },
            ]);
            let decoded;
            try {
                decoded = JSON.parse(response.response.text());
            }
            catch {
                throw new errorHandler_js_1.AppError('Transcription provider returned invalid JSON.', 502, 'AI_INVALID_RESPONSE');
            }
            const validated = transcriptSchema.safeParse(decoded);
            if (!validated.success) {
                throw new errorHandler_js_1.AppError('Transcription provider returned invalid timestamped segments.', 502, 'AI_INVALID_RESPONSE', validated.error.flatten());
            }
            const duration = typeof asset.metadata?.duration === 'number' ? asset.metadata.duration : Number.POSITIVE_INFINITY;
            let lastEnd = 0;
            const segments = validated.data.segments.map((segment) => {
                if (segment.endTime <= segment.startTime || segment.startTime < lastEnd || segment.endTime > duration + 1) {
                    throw new errorHandler_js_1.AppError('Transcription provider returned invalid or out-of-order timestamps.', 502, 'AI_INVALID_TIMESTAMPS');
                }
                lastEnd = segment.endTime;
                return { ...segment, id: `seg_${(0, uuid_1.v4)().slice(0, 8)}` };
            });
            const transcript = {
                id: `trn_${(0, uuid_1.v4)().slice(0, 8)}`,
                assetId,
                fullText: segments.map((segment) => segment.text).join(' '),
                language: validated.data.language,
                confidence: segments.reduce((total, segment) => total + segment.confidence, 0) / segments.length,
                segments,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            memoryStore_js_1.memoryStore.transcripts.set(transcript.id, transcript);
            return transcript;
        }
        finally {
            await fs_1.default.promises.unlink(audioPath).catch((error) => {
                if (error.code !== 'ENOENT')
                    throw error;
            });
        }
    }
    static extractAudio(videoPath, audioPath) {
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(videoPath)
                .noVideo()
                .audioCodec('libmp3lame')
                .audioBitrate('64k')
                .format('mp3')
                .on('end', () => resolve())
                .on('error', (error) => reject(new errorHandler_js_1.AppError(`Audio extraction failed: ${error.message}`, 422, 'AUDIO_EXTRACTION_FAILED')))
                .save(audioPath);
        });
    }
    static async searchTranscripts(query) {
        const q = query.toLowerCase().trim();
        if (!q)
            return [];
        const matches = [];
        memoryStore_js_1.memoryStore.transcripts.forEach((transcript) => {
            transcript.segments.forEach((segment) => {
                if (segment.text.toLowerCase().includes(q)) {
                    matches.push({ assetId: transcript.assetId, segment });
                }
            });
        });
        return matches;
    }
}
exports.TranscriptionService = TranscriptionService;
exports.default = TranscriptionService;

import { GoogleGenerativeAI } from '@google/generative-ai';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { memoryStore, TranscriptRecord } from '../db/memoryStore.js';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { resolveLocalMediaPath } from './mediaPath.js';

const transcriptSchema = z.object({
  language: z.string().min(2).max(24),
  segments: z.array(z.object({
    startTime: z.number().nonnegative(),
    endTime: z.number().positive(),
    text: z.string().trim().min(1).max(2000),
    confidence: z.number().min(0).max(1),
  })).min(1).max(5000),
});

export class TranscriptionService {
  public static async getTranscriptForAsset(assetId: string): Promise<TranscriptRecord | null> {
    return Array.from(memoryStore.transcripts.values()).find((transcript) => transcript.assetId === assetId) || null;
  }

  public static async transcribeAsset(assetId: string): Promise<TranscriptRecord> {
    const asset = memoryStore.assets.get(assetId);
    if (!asset || asset.type !== 'video') {
      throw new AppError('Video asset not found', 404, 'ASSET_NOT_FOUND');
    }
    if (!config.geminiApiKey) {
      throw new AppError('Transcription requires GEMINI_API_KEY. No transcript has been fabricated.', 503, 'AI_NOT_CONFIGURED');
    }

    const videoPath = resolveLocalMediaPath(asset.url);
    const uploadDir = path.resolve(config.localStorageDir);
    const audioPath = path.join(uploadDir, `transcript-${uuidv4()}.mp3`);
    try {
      await this.extractAudio(videoPath, audioPath);
      const stat = await fs.promises.stat(audioPath);
      if (stat.size > 14 * 1024 * 1024) {
        throw new AppError('Extracted audio exceeds the Gemini inline-transcription limit. Split the source into shorter segments.', 413, 'AUDIO_TOO_LARGE');
      }
      const audioData = (await fs.promises.readFile(audioPath)).toString('base64');
      const client = new GoogleGenerativeAI(config.geminiApiKey);
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

      let decoded: unknown;
      try {
        decoded = JSON.parse(response.response.text());
      } catch {
        throw new AppError('Transcription provider returned invalid JSON.', 502, 'AI_INVALID_RESPONSE');
      }
      const validated = transcriptSchema.safeParse(decoded);
      if (!validated.success) {
        throw new AppError('Transcription provider returned invalid timestamped segments.', 502, 'AI_INVALID_RESPONSE', validated.error.flatten());
      }
      const duration = typeof asset.metadata?.duration === 'number' ? asset.metadata.duration : Number.POSITIVE_INFINITY;
      let lastEnd = 0;
      const segments = validated.data.segments.map((segment) => {
        if (segment.endTime <= segment.startTime || segment.startTime < lastEnd || segment.endTime > duration + 1) {
          throw new AppError('Transcription provider returned invalid or out-of-order timestamps.', 502, 'AI_INVALID_TIMESTAMPS');
        }
        lastEnd = segment.endTime;
        return { ...segment, id: `seg_${uuidv4().slice(0, 8)}` };
      });
      const transcript: TranscriptRecord = {
        id: `trn_${uuidv4().slice(0, 8)}`,
        assetId,
        fullText: segments.map((segment) => segment.text).join(' '),
        language: validated.data.language,
        confidence: segments.reduce((total, segment) => total + segment.confidence, 0) / segments.length,
        segments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.transcripts.set(transcript.id, transcript);
      return transcript;
    } finally {
      await fs.promises.unlink(audioPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }

  private static extractAudio(videoPath: string, audioPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('64k')
        .format('mp3')
        .on('end', () => resolve())
        .on('error', (error) => reject(new AppError(`Audio extraction failed: ${error.message}`, 422, 'AUDIO_EXTRACTION_FAILED')))
        .save(audioPath);
    });
  }

  public static async searchTranscripts(query: string): Promise<Array<{ assetId: string; segment: TranscriptRecord['segments'][number] }>> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const matches: Array<{ assetId: string; segment: TranscriptRecord['segments'][number] }> = [];
    memoryStore.transcripts.forEach((transcript) => {
      transcript.segments.forEach((segment) => {
        if (segment.text.toLowerCase().includes(q)) {
          matches.push({ assetId: transcript.assetId, segment });
        }
      });
    });
    return matches;
  }
}
export default TranscriptionService;

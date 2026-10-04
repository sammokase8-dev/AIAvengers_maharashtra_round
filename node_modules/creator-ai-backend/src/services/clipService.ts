import { memoryStore, ClipRecord } from '../db/memoryStore.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler.js';
import { TranscriptionService } from './transcriptionService.js';
import { GeminiService } from './geminiService.js';

export interface GenerateClipsPayload {
  sourceAssetId: string;
  projectId?: string;
  guidanceText?: string;
  targetCount?: number;
}

export class ClipService {
  public static async generateClips(payload: GenerateClipsPayload, userId = 'usr_demo_01'): Promise<ClipRecord[]> {
    const asset = memoryStore.assets.get(payload.sourceAssetId);
    if (!asset || asset.userId !== userId || asset.type !== 'video') {
      throw new AppError('Source video was not found', 404, 'ASSET_NOT_FOUND');
    }
    if (payload.projectId && memoryStore.projects.get(payload.projectId)?.userId !== userId) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }
    const transcript = await TranscriptionService.getTranscriptForAsset(asset.id);
    if (!transcript) {
      throw new AppError('Generate a timestamped transcript for this video before selecting clips.', 409, 'TRANSCRIPT_REQUIRED');
    }

    const segments = transcript.segments
      .filter((segment) => Number.isFinite(segment.startTime) && Number.isFinite(segment.endTime) &&
        segment.startTime >= 0 && segment.endTime > segment.startTime && segment.text.trim().length > 0)
      .sort((a, b) => a.startTime - b.startTime);
    const maxDuration = typeof asset.metadata?.duration === 'number'
      ? asset.metadata.duration
      : Number.POSITIVE_INFINITY;
    const candidates: Array<typeof segments> = [];
    const guidanceTokens = new Set(
      (payload.guidanceText?.toLowerCase().match(/[a-z0-9]+/g) || []).filter((word) => word.length > 2)
    );
    let current: typeof segments = [];
    let currentEnd = 0;

    for (const segment of segments) {
      if (segment.endTime > maxDuration || segment.endTime - segment.startTime > 60) continue;
      const duration = segment.endTime - (current[0]?.startTime ?? segment.startTime);
      if (current.length > 0 && duration > 60) {
        candidates.push(current);
        current = [];
      }
      current.push(segment);
      currentEnd = segment.endTime;
      if (currentEnd - current[0].startTime >= 15) {
        candidates.push(current);
        current = [];
      }
    }
    if (current.length > 0 && currentEnd - current[0].startTime >= 8) {
      candidates.push(current);
    }

    const uniqueCandidates = candidates
      .filter((candidate) => candidate.length > 0)
      .filter((candidate, index, all) =>
        all.findIndex((other) =>
          other[0].startTime === candidate[0].startTime &&
          other[other.length - 1].endTime === candidate[candidate.length - 1].endTime
        ) === index
      )
      .map((candidate) => {
        const candidateTokens = new Set(
          candidate.flatMap((segment) => segment.text.toLowerCase().match(/[a-z0-9]+/g) || [])
        );
        const matchedGuidanceWords = [...guidanceTokens].filter((word) => candidateTokens.has(word));
        const guidanceFit = guidanceTokens.size ? matchedGuidanceWords.length / guidanceTokens.size : 0;
        const text = candidate.map((segment) => segment.text.trim()).join(' ');
        const hasHookMarker = /^(how|why|what|stop|here|if|the \d+|number \d+)/i.test(text);
        const isSentenceComplete = /[.!?]["')\]]?$/.test(text);
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        const baseScore = 45 + Math.min(20, candidate.length * 5) +
          (hasHookMarker ? 15 : 0) + (isSentenceComplete ? 10 : 0) + (wordCount >= 12 ? 10 : 0);
        return { candidate, guidanceFit, selectionScore: Math.min(100, Math.round(baseScore + guidanceFit * 15)), matchedGuidanceWords };
      })
      .sort((left, right) =>
        right.selectionScore - left.selectionScore ||
        left.candidate[0].startTime - right.candidate[0].startTime
      )
      .slice(0, Math.min(10, Math.max(1, payload.targetCount || 3)));

    if (uniqueCandidates.length === 0) {
      throw new AppError('No complete transcript interval is long enough to make a clip.', 422, 'NO_CLIP_CANDIDATES');
    }

    return uniqueCandidates.map(({ candidate, selectionScore, matchedGuidanceWords }) => {
      const first = candidate[0];
      const last = candidate[candidate.length - 1];
      const text = candidate.map((segment) => segment.text.trim()).join(' ');
      const words = text.split(/\s+/).filter(Boolean);
      const hookWords = words.slice(0, 12);
      const hook = hookWords.join(' ');
      const duration = Math.round((last.endTime - first.startTime) * 10) / 10;
      const platforms = duration <= 60
        ? ['youtube_shorts', 'instagram_reels', 'tiktok']
        : ['youtube', 'linkedin'];

      const clip: ClipRecord = {
        id: `clp_${uuidv4().slice(0, 8)}`,
        projectId: payload.projectId,
        sourceAssetId: asset.id,
        title: words.slice(0, 8).join(' ').replace(/[.!?]+$/, ''),
        hook,
        startTime: first.startTime,
        endTime: last.endTime,
        duration,
        selectionScore,
        reasoning: `Transcript candidate spanning ${candidate.length} sentence segment(s); interval ${first.startTime.toFixed(1)}s–${last.endTime.toFixed(1)}s. Selection score reflects transcript hook/duration signals${matchedGuidanceWords.length ? ` and ${matchedGuidanceWords.length} guidance-word match(es)` : ''}, not predicted views.`,
        recommendedPlatforms: platforms,
        aspectRatio: '9:16',
        previewUrl: asset.url,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.clips.set(clip.id, clip);
      return clip;
    });
  }

  public static async getClips(filter?: { projectId?: string; status?: string }, userId = 'usr_demo_01'): Promise<ClipRecord[]> {
    let all = Array.from(memoryStore.clips.values());
    all = all.filter((clip) => {
      const project = clip.projectId ? memoryStore.projects.get(clip.projectId) : undefined;
      const asset = memoryStore.assets.get(clip.sourceAssetId);
      return (project?.userId === userId || (!clip.projectId && asset?.userId === userId)) && asset?.userId === userId;
    });
    if (filter?.projectId) all = all.filter((clip) => clip.projectId === filter.projectId);
    if (filter?.status) all = all.filter((clip) => clip.status === filter.status);
    return all;
  }

  public static async updateClipStatus(
    clipId: string,
    status: 'accepted' | 'rejected' | 'in_editor',
    userId = 'usr_demo_01'
  ): Promise<ClipRecord> {
    const clip = memoryStore.clips.get(clipId);
    if (!clip || memoryStore.assets.get(clip.sourceAssetId)?.userId !== userId) throw new AppError('Clip not found', 404, 'NOT_FOUND');
    clip.status = status;
    clip.updatedAt = new Date().toISOString();
    return clip;
  }

  public static async regenerateClipHook(clipId: string, style?: string, userId = 'usr_demo_01'): Promise<ClipRecord> {
    const clip = memoryStore.clips.get(clipId);
    if (!clip || memoryStore.assets.get(clip.sourceAssetId)?.userId !== userId) throw new AppError('Clip not found', 404, 'NOT_FOUND');
    if (style && !['viral', 'curiosity', 'polarizing', 'educational'].includes(style)) {
      throw new AppError('Unsupported hook style', 400, 'BAD_REQUEST');
    }
    const generated = await GeminiService.generateContent({
      operation: 'hook',
      prompt: `Create an opening hook based only on this transcript excerpt: ${clip.hook}`,
      tone: style || 'curiosity',
      targetPlatform: clip.recommendedPlatforms[0],
    });
    if (generated.isDemoData || !generated.hook) {
      throw new AppError('Hook regeneration requires a configured Gemini API key.', 503, 'AI_NOT_CONFIGURED');
    }
    clip.hook = generated.hook;
    clip.updatedAt = new Date().toISOString();
    return clip;
  }
}
export default ClipService;

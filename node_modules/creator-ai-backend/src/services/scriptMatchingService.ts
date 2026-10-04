import { memoryStore } from '../db/memoryStore.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler.js';
import { TranscriptionService } from './transcriptionService.js';

export interface ScriptSegmentResult {
  id: string;
  sentenceIndex: number;
  text: string;
  suggestedBroll?: string;
  timestampEstimate?: { start: number; end: number };
}

export interface MatchedFootageResult {
  id: string;
  scriptSegmentId: string;
  assetId: string;
  assetName: string;
  startTime: number;
  endTime: number;
  confidence: number;
  matchedKeywords: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'manual_adjusted';
  previewUrl?: string;
}

const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'we', 'what', 'when', 'with', 'you']);
const tokenize = (value: string): Set<string> =>
  new Set(value.toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !STOP_WORDS.has(word)) || []);

export class ScriptMatchingService {
  public static async matchScriptToVideo(
    projectId: string,
    scriptText: string,
    assetId?: string
  ): Promise<{
    projectId: string;
    scriptText: string;
    segments: ScriptSegmentResult[];
    matchedFootage: MatchedFootageResult[];
    totalMatches: number;
    unmatchedCount: number;
  }> {
    const project = memoryStore.projects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND');
    const video = assetId
      ? memoryStore.assets.get(assetId)
      : Array.from(memoryStore.assets.values()).find((asset) => asset.userId === project.userId && asset.type === 'video');
    if (!video || video.userId !== project.userId || video.type !== 'video') {
      throw new AppError('A video owned by this project creator is required for matching.', 404, 'ASSET_NOT_FOUND');
    }
    const transcript = await TranscriptionService.getTranscriptForAsset(video.id);
    if (!transcript) {
      throw new AppError('Generate a timestamped transcript for this video before matching a script.', 409, 'TRANSCRIPT_REQUIRED');
    }

    const sentences = scriptText.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
    if (sentences.length === 0) throw new AppError('Script text must contain at least one sentence.', 400, 'BAD_REQUEST');

    const segments: ScriptSegmentResult[] = sentences.map((text, sentenceIndex) => ({
      id: `sseg_${uuidv4().slice(0, 8)}`,
      sentenceIndex,
      text,
    }));
    const transcriptSegments = transcript.segments
      .filter((segment) => segment.startTime >= 0 && segment.endTime > segment.startTime)
      .sort((a, b) => a.startTime - b.startTime);
    const matchedFootage: MatchedFootageResult[] = [];

    for (const segment of segments) {
      const scriptWords = tokenize(segment.text);
      let best: typeof transcriptSegments[number] | undefined;
      let bestOverlap = 0;
      let bestKeywords: string[] = [];
      for (const candidate of transcriptSegments) {
        const transcriptWords = tokenize(candidate.text);
        const matchedKeywords = [...scriptWords].filter((word) => transcriptWords.has(word));
        const overlap = scriptWords.size ? matchedKeywords.length / scriptWords.size : 0;
        if (overlap > bestOverlap) {
          best = candidate;
          bestOverlap = overlap;
          bestKeywords = matchedKeywords;
        }
      }
      if (!best || bestOverlap < 0.2) continue;
      matchedFootage.push({
        id: `match_${uuidv4().slice(0, 8)}`,
        scriptSegmentId: segment.id,
        assetId: video.id,
        assetName: video.name,
        startTime: best.startTime,
        endTime: best.endTime,
        confidence: Math.round(Math.min(0.99, bestOverlap * 0.7 + best.confidence * 0.3) * 100) / 100,
        matchedKeywords: bestKeywords,
        status: 'pending',
        previewUrl: video.url,
      });
      segment.timestampEstimate = { start: best.startTime, end: best.endTime };
    }

    const result = {
      projectId,
      scriptText,
      segments,
      matchedFootage,
      totalMatches: matchedFootage.length,
      unmatchedCount: segments.length - matchedFootage.length,
    };
    matchedFootage.forEach((match) => this.matchesStore.set(match.id, match));
    this.projectMatchResults.set(projectId, result);
    return result;
  }

  public static matchesStore = new Map<string, MatchedFootageResult>();
  public static projectMatchResults = new Map<string, Awaited<ReturnType<typeof this.matchScriptToVideo>>>();

  public static async getProjectMatches(projectId: string) {
    const cached = this.projectMatchResults.get(projectId);
    if (cached) return cached;
    const script = Array.from(memoryStore.scripts.values()).find((item) => item.projectId === projectId);
    if (!script) throw new AppError('Save a script to this project before matching footage.', 409, 'SCRIPT_REQUIRED');
    return this.matchScriptToVideo(projectId, script.rawText);
  }

  public static updateMatchStatus(
    projectId: string,
    matchId: string,
    status: 'accepted' | 'rejected' | 'manual_adjusted',
    startTime?: number,
    endTime?: number
  ): { success: boolean; matchId: string; status: string; match: MatchedFootageResult } {
    const match = this.matchesStore.get(matchId);
    const projectResult = this.projectMatchResults.get(projectId);
    if (!match || !projectResult?.matchedFootage.some((item) => item.id === matchId)) {
      throw new AppError('Footage match not found', 404, 'NOT_FOUND');
    }
    if (startTime !== undefined || endTime !== undefined) {
      const nextStart = startTime ?? match.startTime;
      const nextEnd = endTime ?? match.endTime;
      if (!Number.isFinite(nextStart) || !Number.isFinite(nextEnd) || nextStart < 0 || nextEnd <= nextStart) {
        throw new AppError('Match start/end timestamps are invalid.', 400, 'BAD_REQUEST');
      }
      const duration = Number(memoryStore.assets.get(match.assetId)?.metadata?.duration);
      if (Number.isFinite(duration) && nextEnd > duration) {
        throw new AppError('Match end time exceeds the source video duration.', 400, 'BAD_REQUEST');
      }
      match.startTime = nextStart;
      match.endTime = nextEnd;
      status = 'manual_adjusted';
    }
    match.status = status;
    this.matchesStore.set(matchId, match);
    return { success: true, matchId, status, match };
  }
}
export default ScriptMatchingService;

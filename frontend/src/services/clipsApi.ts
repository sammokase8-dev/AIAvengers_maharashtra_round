import apiClient from '../api/client';
import { GeneratedClip, RealTimeJob } from '../types';

export interface GenerateClipsPayload {
  sourceAssetId: string;
  projectId?: string;
  scriptText?: string;
  maxClips?: number;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  targetPlatforms?: string[];
}

export const clipsApi = {
  getClips(projectId?: string): Promise<GeneratedClip[]> {
    return apiClient.get<GeneratedClip[]>('/clips', { projectId });
  },

  startClipGeneration(payload: GenerateClipsPayload): Promise<RealTimeJob> {
    return apiClient.post<RealTimeJob>('/clips/generate', {
      sourceAssetId: payload.sourceAssetId,
      projectId: payload.projectId,
      guidanceText: payload.scriptText,
      targetCount: payload.maxClips,
    });
  },

  updateClipStatus(clipId: string, status: 'accepted' | 'rejected' | 'in_editor'): Promise<GeneratedClip> {
    return apiClient.patch<GeneratedClip>(`/clips/${clipId}/status`, { status });
  },

  regenerateClipHook(clipId: string, style?: string): Promise<GeneratedClip> {
    return apiClient.post<GeneratedClip>(`/clips/${clipId}/regenerate-hook`, { style });
  },
};
export default clipsApi;

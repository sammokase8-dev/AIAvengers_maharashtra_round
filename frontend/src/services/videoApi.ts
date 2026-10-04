import apiClient from '../api/client';
import { EditModel, RealTimeJob, TranscriptRecord } from '../types';

export const videoApi = {
  getTranscript(assetId: string): Promise<TranscriptRecord | null> {
    return apiClient.get<TranscriptRecord | null>(`/video/transcript/${assetId}`);
  },

  transcribeAsset(assetId: string): Promise<RealTimeJob> {
    return apiClient.post<RealTimeJob>(`/video/transcript/${assetId}/generate`);
  },

  getProjectEditTimeline(projectId: string): Promise<EditModel> {
    return apiClient.get<EditModel>(`/video/projects/${projectId}/timeline`);
  },

  async saveProjectEditTimeline(projectId: string, timeline: EditModel): Promise<{ success: boolean; lastSavedAt: string }> {
    const saved = await apiClient.put<EditModel>(`/video/projects/${projectId}/timeline`, timeline);
    return { success: true, lastSavedAt: saved.lastSavedAt };
  },

  async requestBackendRender(projectId: string, timeline: EditModel, exportFormat: { resolution: string; fps: number; preset: string }): Promise<RealTimeJob> {
    return apiClient.post<RealTimeJob>(`/video/projects/${projectId}/render`, {
      timeline,
      exportFormat,
    });
  },
};
export default videoApi;

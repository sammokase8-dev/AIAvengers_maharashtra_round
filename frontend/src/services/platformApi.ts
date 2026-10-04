import apiClient from '../api/client';
import { PlatformAdaptationConfig, PlatformType, RealTimeJob } from '../types';

export const platformApi = {
  getAdaptations(projectId?: string): Promise<PlatformAdaptationConfig[]> {
    return apiClient.get<PlatformAdaptationConfig[]>('/platforms/adaptations', { projectId });
  },

  updateAdaptation(platform: PlatformType, updates: Partial<PlatformAdaptationConfig>): Promise<PlatformAdaptationConfig> {
    return apiClient.patch<PlatformAdaptationConfig>(`/platforms/adaptations/${platform}`, updates);
  },

  exportPlatformVariant(projectId: string, platform: PlatformType): Promise<RealTimeJob> {
    return apiClient.post<RealTimeJob>(`/platforms/adaptations/${platform}/export`, { projectId });
  },
};
export default platformApi;

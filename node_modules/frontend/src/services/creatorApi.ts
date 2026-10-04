import apiClient from '../api/client';
import { CreatorProfile, PlatformType, SocialConnection } from '../types';

export const creatorApi = {
  getProfile(): Promise<CreatorProfile> {
    return apiClient.get<CreatorProfile>('/creator/profile');
  },

  updateProfile(updates: Partial<CreatorProfile>): Promise<CreatorProfile> {
    return apiClient.put<CreatorProfile>('/creator/profile', updates);
  },

  async connectPlatform(platform: PlatformType): Promise<SocialConnection> {
    const connection = await apiClient.post<{
      platform: string;
      connected: boolean;
      accountHandle?: string;
      followerCount?: number;
      connectedAt?: string;
    }>('/platforms/toggle', { platform, connect: true });
    return {
      platform,
      connected: connection.connected,
      handle: connection.accountHandle,
      followerCount: connection.followerCount,
      connectedAt: connection.connectedAt,
    };
  },

  async disconnectPlatform(platform: string): Promise<{ success: boolean }> {
    await apiClient.post('/platforms/toggle', { platform, connect: false });
    return { success: true };
  },
};
export default creatorApi;

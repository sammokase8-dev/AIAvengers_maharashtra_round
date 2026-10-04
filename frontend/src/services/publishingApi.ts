import apiClient from '../api/client';
import { ScheduledPost, PublishingStatus, PlatformType } from '../types';

export const publishingApi = {
  getScheduledPosts(filter?: { status?: PublishingStatus; platform?: PlatformType }): Promise<ScheduledPost[]> {
    return apiClient.get<ScheduledPost[]>('/publishing/posts', filter);
  },

  schedulePost(payload: Partial<ScheduledPost>): Promise<ScheduledPost> {
    return apiClient.post<ScheduledPost>('/publishing/schedule', payload);
  },

  publishNow(postId: string): Promise<ScheduledPost> {
    return apiClient.post<ScheduledPost>(`/publishing/posts/${postId}/publish-now`);
  },

  cancelScheduledPost(postId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/publishing/posts/${postId}`);
  },

  retryFailedPost(postId: string): Promise<ScheduledPost> {
    return apiClient.post<ScheduledPost>(`/publishing/posts/${postId}/retry`);
  },

  reschedulePost(postId: string, newTime: string): Promise<ScheduledPost> {
    return apiClient.patch<ScheduledPost>(`/publishing/posts/${postId}/reschedule`, { scheduledTime: newTime });
  },
};
export default publishingApi;

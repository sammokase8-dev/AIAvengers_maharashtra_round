import apiClient from '../api/client';
import { RealTimeJob } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export const notificationsApi = {
  async getNotifications(): Promise<AppNotification[]> {
    const notifications = await apiClient.get<Array<Omit<AppNotification, 'read'> & { isRead: boolean }>>('/notifications');
    return notifications.map(({ isRead, ...notification }) => ({ ...notification, read: isRead }));
  },

  markAsRead(id: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/notifications/${id}/read`);
  },

  markAllAsRead(): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/notifications/read-all');
  },

  getActiveJobs(): Promise<RealTimeJob[]> {
    return apiClient.get<RealTimeJob[]>('/jobs/active');
  },

  retryJob(id: string): Promise<RealTimeJob> {
    return apiClient.post<RealTimeJob>(`/jobs/${id}/retry`);
  },

  async dismissJob(id: string): Promise<void> {
    await apiClient.delete(`/jobs/${id}`);
  },
};
export default notificationsApi;

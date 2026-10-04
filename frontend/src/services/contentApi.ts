import apiClient from '../api/client';
import { Project, ProjectStatus, ScriptMatchResult } from '../types';

export const contentApi = {
  getProjects(status?: ProjectStatus): Promise<Project[]> {
    return apiClient.get<Project[]>('/content/projects', { status });
  },

  getProjectById(id: string): Promise<Project> {
    return apiClient.get<Project>(`/content/projects/${id}`);
  },

  createProject(project: Partial<Project>): Promise<Project> {
    return apiClient.post<Project>('/content/projects', project);
  },

  updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    return apiClient.patch<Project>(`/content/projects/${id}`, updates);
  },

  deleteProject(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/content/projects/${id}`);
  },

  getScriptFootageMatch(projectId: string): Promise<ScriptMatchResult> {
    return apiClient.get<ScriptMatchResult>(`/content/projects/${projectId}/script-match`);
  },

  updateMatchStatus(
    projectId: string,
    matchId: string,
    status: 'accepted' | 'rejected' | 'manual_adjusted',
    adjustments?: { startTime: number; endTime: number }
  ): Promise<{ success: boolean }> {
    return apiClient.patch<{ success: boolean }>(`/content/projects/${projectId}/script-match/${matchId}`, {
      status,
      startTime: adjustments?.startTime,
      endTime: adjustments?.endTime,
    });
  },
};
export default contentApi;

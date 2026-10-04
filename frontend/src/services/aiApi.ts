import apiClient from '../api/client';
import { AIContentPayload, AIGeneratedContent, ToneType, PlatformType } from '../types';

export interface AIActionPayload {
  contentId: string;
  action: 'improve' | 'shorten' | 'change_tone' | 'adapt_platform';
  targetTone?: ToneType;
  targetPlatform?: PlatformType;
  customInstruction?: string;
  content: string;
}

export const aiApi = {
  generateContent(payload: AIContentPayload): Promise<AIGeneratedContent> {
    return apiClient.post<AIGeneratedContent>('/ai/generate', payload);
  },

  async transformContent(payload: AIActionPayload): Promise<AIGeneratedContent> {
    const transformed = await apiClient.post<{ transformedContent: string; isDemoData: boolean }>('/ai/transform', payload);
    return {
      id: `ai_trans_${Date.now()}`,
      operation: 'script',
      script: transformed.transformedContent,
      tone: payload.targetTone || 'viral',
      platform: payload.targetPlatform || 'youtube',
      createdAt: new Date().toISOString(),
      isDemoData: transformed.isDemoData,
    };
  },
};
export default aiApi;

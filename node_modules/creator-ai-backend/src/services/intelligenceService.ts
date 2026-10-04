import { memoryStore, AIInsightRecord } from '../db/memoryStore.js';

export class IntelligenceService {
  public static async getInsights(userId: string): Promise<AIInsightRecord[]> {
    return Array.from(memoryStore.insights.values()).filter(
      (ins) => ins.userId === userId && !ins.isDismissed
    );
  }

  public static async dismissInsight(insightId: string, userId: string): Promise<boolean> {
    const ins = memoryStore.insights.get(insightId);
    if (ins?.userId === userId) {
      ins.isDismissed = true;
      return true;
    }
    return false;
  }
}
export default IntelligenceService;

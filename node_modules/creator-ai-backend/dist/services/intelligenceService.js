"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceService = void 0;
const memoryStore_js_1 = require("../db/memoryStore.js");
class IntelligenceService {
    static async getInsights(userId) {
        return Array.from(memoryStore_js_1.memoryStore.insights.values()).filter((ins) => ins.userId === userId && !ins.isDismissed);
    }
    static async dismissInsight(insightId, userId) {
        const ins = memoryStore_js_1.memoryStore.insights.get(insightId);
        if (ins?.userId === userId) {
            ins.isDismissed = true;
            return true;
        }
        return false;
    }
}
exports.IntelligenceService = IntelligenceService;
exports.default = IntelligenceService;

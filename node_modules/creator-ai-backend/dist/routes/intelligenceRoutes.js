"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intelligenceRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const intelligenceService_js_1 = require("../services/intelligenceService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
exports.intelligenceRoutes = (0, express_1.Router)();
// GET /api/intelligence/insights
exports.intelligenceRoutes.get('/insights', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id || 'usr_demo_01';
        const insights = await intelligenceService_js_1.IntelligenceService.getInsights(userId);
        res.json({ success: true, data: insights });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/intelligence/insights/:id/dismiss
exports.intelligenceRoutes.post('/insights/:id/dismiss', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const dismissed = await intelligenceService_js_1.IntelligenceService.dismissInsight(req.params.id, req.user?.id || 'usr_demo_01');
        if (!dismissed) {
            return next(new errorHandler_js_1.AppError('Insight not found', 404, 'NOT_FOUND'));
        }
        res.json({ success: true, message: 'Insight dismissed' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = exports.intelligenceRoutes;

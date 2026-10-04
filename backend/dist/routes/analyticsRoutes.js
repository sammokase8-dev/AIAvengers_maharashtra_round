"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const analyticsService_js_1 = require("../services/analyticsService.js");
exports.analyticsRoutes = (0, express_1.Router)();
// GET /api/analytics/dashboard
exports.analyticsRoutes.get('/dashboard', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id || 'usr_demo_01';
        const range = req.query.range || '30d';
        const data = await analyticsService_js_1.AnalyticsService.getDashboardAnalytics(userId, range);
        res.json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
});
exports.default = exports.analyticsRoutes;

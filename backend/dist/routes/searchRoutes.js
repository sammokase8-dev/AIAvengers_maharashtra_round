"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const searchService_js_1 = require("../services/searchService.js");
exports.searchRoutes = (0, express_1.Router)();
// GET /api/search?q=query
exports.searchRoutes.get('/', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const q = req.query.q || '';
        const userId = req.user?.id || 'usr_demo_01';
        const results = await searchService_js_1.SearchService.searchAll(q, userId);
        res.json({ success: true, data: results });
    }
    catch (err) {
        next(err);
    }
});
exports.default = exports.searchRoutes;

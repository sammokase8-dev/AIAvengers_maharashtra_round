"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creatorRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const authService_js_1 = require("../services/authService.js");
const memoryStore_js_1 = require("../db/memoryStore.js");
exports.creatorRoutes = (0, express_1.Router)();
exports.creatorRoutes.get('/profile', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id || 'usr_demo_01';
        const profile = await authService_js_1.AuthService.getProfile(userId);
        res.json({ success: true, data: profile });
    }
    catch (err) {
        next(err);
    }
});
exports.creatorRoutes.put('/profile', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profile = Array.from(memoryStore_js_1.memoryStore.profiles.values()).find((p) => p.userId === userId);
        if (profile) {
            if (req.body.channelName)
                profile.channelName = req.body.channelName;
            if (req.body.niche)
                profile.niche = req.body.niche;
            if (req.body.bio)
                profile.bio = req.body.bio;
            if (req.body.languagePreference)
                profile.languagePreference = req.body.languagePreference;
            profile.updatedAt = new Date().toISOString();
        }
        const updated = await authService_js_1.AuthService.getProfile(userId);
        res.json({ success: true, data: updated, message: 'Profile updated' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = exports.creatorRoutes;

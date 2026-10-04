"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const authService_js_1 = require("../services/authService.js");
const auth_js_1 = require("../middleware/auth.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
exports.authRoutes = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
    channelName: zod_1.z.string().optional(),
    niche: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.authRoutes.post('/register', async (req, res, next) => {
    try {
        const parseResult = registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            throw new errorHandler_js_1.AppError(parseResult.error.errors[0].message, 400, 'VALIDATION_ERROR', parseResult.error.format());
        }
        const data = await authService_js_1.AuthService.register(parseResult.data);
        res.status(201).json({ success: true, data, message: 'Account created successfully' });
    }
    catch (err) {
        next(err);
    }
});
exports.authRoutes.post('/login', async (req, res, next) => {
    try {
        const parseResult = loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            throw new errorHandler_js_1.AppError(parseResult.error.errors[0].message, 400, 'VALIDATION_ERROR', parseResult.error.format());
        }
        const data = await authService_js_1.AuthService.login(parseResult.data);
        res.json({ success: true, data, message: 'Signed in successfully' });
    }
    catch (err) {
        next(err);
    }
});
exports.authRoutes.get('/me', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const data = await authService_js_1.AuthService.getProfile(req.user.id);
        res.json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
});
exports.authRoutes.post('/forgot-password', async (req, res, next) => {
    try {
        const result = await authService_js_1.AuthService.forgotPassword(req.body.email);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.authRoutes.post('/reset-password', async (req, res, next) => {
    try {
        const result = await authService_js_1.AuthService.resetPassword(req.body.token, req.body.newPassword);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.authRoutes.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Signed out successfully' });
});
exports.default = exports.authRoutes;

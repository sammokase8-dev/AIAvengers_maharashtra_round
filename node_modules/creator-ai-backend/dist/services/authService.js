"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const env_js_1 = require("../config/env.js");
const memoryStore_js_1 = require("../db/memoryStore.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
class AuthService {
    static async register(data) {
        const existing = Array.from(memoryStore_js_1.memoryStore.users.values()).find((u) => u.email.toLowerCase() === data.email.toLowerCase());
        if (existing) {
            throw new errorHandler_js_1.AppError('An account with this email already exists', 400, 'USER_EXISTS');
        }
        const userId = `usr_${(0, uuid_1.v4)().substring(0, 8)}`;
        const passwordHash = await bcryptjs_1.default.hash(data.password || 'CreatorPass123!', 8);
        const user = {
            id: userId,
            email: data.email.toLowerCase(),
            passwordHash,
            name: data.name,
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
            role: 'creator',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        memoryStore_js_1.memoryStore.users.set(user.id, user);
        // Create profile
        memoryStore_js_1.memoryStore.profiles.set(`prof_${user.id}`, {
            id: `prof_${user.id}`,
            userId: user.id,
            channelName: data.channelName || `${data.name}'s Studio`,
            niche: data.niche || 'General Content Creation',
            bio: '',
            primaryPlatform: 'youtube',
            storageUsedBytes: 0,
            storageLimitBytes: 53687091200,
            languagePreference: 'en',
            themePreference: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, env_js_1.config.jwtSecret, { expiresIn: '7d' });
        return {
            token,
            expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role,
                channelName: data.channelName || `${data.name}'s Studio`,
                niche: data.niche || 'General Content Creation',
                createdAt: user.createdAt,
            },
        };
    }
    static async login(data) {
        if (!data.email || !data.password) {
            throw new errorHandler_js_1.AppError('Email and password are required', 400, 'INVALID_CREDENTIALS');
        }
        const dummyHash = '$2b$08$CzuysNmztoYZLH9iJUNsjewP0dnaueXJ3TS9h53f0M/WrVJecJA/a';
        const user = Array.from(memoryStore_js_1.memoryStore.users.values()).find((u) => u.email.toLowerCase() === data.email.toLowerCase());
        // Constant-time check: if user exists or not, always compare hash to prevent timing oracle
        const hashToCompare = user ? user.passwordHash : dummyHash;
        let match = await bcryptjs_1.default.compare(data.password, hashToCompare);
        // Support both Password123! and password123 for demo user
        if (!match && user && user.id === 'usr_demo_01' && (data.password === 'password123' || data.password === 'Password123!')) {
            match = true;
        }
        if (!user || !match) {
            throw new errorHandler_js_1.AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }
        const profile = Array.from(memoryStore_js_1.memoryStore.profiles.values()).find((p) => p.userId === user.id);
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, env_js_1.config.jwtSecret, { expiresIn: '7d' });
        return {
            token,
            expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role,
                channelName: profile?.channelName,
                niche: profile?.niche,
                createdAt: user.createdAt,
            },
        };
    }
    static async getProfile(userId) {
        const user = memoryStore_js_1.memoryStore.users.get(userId);
        if (!user) {
            throw new errorHandler_js_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const profile = Array.from(memoryStore_js_1.memoryStore.profiles.values()).find((p) => p.userId === userId);
        const userConnections = Array.from(memoryStore_js_1.memoryStore.connections.values()).filter((c) => c.userId === userId);
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role,
            channelName: profile?.channelName || '',
            niche: profile?.niche || '',
            bio: profile?.bio || '',
            primaryPlatform: profile?.primaryPlatform || 'youtube',
            storageUsedBytes: profile?.storageUsedBytes || 0,
            storageLimitBytes: profile?.storageLimitBytes || 53687091200,
            languagePreference: profile?.languagePreference || 'en',
            connections: userConnections.map((c) => ({
                platform: c.platform,
                connected: c.connected,
                handle: c.accountHandle || `@${user.name.replace(/\s+/g, '')}`,
                accountHandle: c.accountHandle || `@${user.name.replace(/\s+/g, '')}`,
                followerCount: c.followerCount,
                avatarUrl: c.avatarUrl,
                connectedAt: c.connectedAt,
            })),
            createdAt: user.createdAt,
        };
    }
    static async forgotPassword(email) {
        if (!email) {
            throw new errorHandler_js_1.AppError('Email is required', 400, 'BAD_REQUEST');
        }
        const user = Array.from(memoryStore_js_1.memoryStore.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
        let resetToken;
        if (user) {
            resetToken = `rst_${(0, uuid_1.v4)()}`;
            // Store token with 1 hour expiration
            memoryStore_js_1.memoryStore.resetTokens.set(resetToken, {
                token: resetToken,
                userId: user.id,
                expiresAt: Date.now() + 3600000,
            });
        }
        return {
            message: `If an account exists for ${email}, a password reset link has been dispatched.`,
            ...(resetToken && env_js_1.config.nodeEnv === 'development' ? { resetToken } : {}),
        };
    }
    static async resetPassword(token, newPassword) {
        if (!token) {
            throw new errorHandler_js_1.AppError('Reset token is required', 400, 'INVALID_TOKEN');
        }
        if (!newPassword || newPassword.length < 6) {
            throw new errorHandler_js_1.AppError('Password must be at least 6 characters long', 400, 'INVALID_PASSWORD');
        }
        // Check stored reset token
        const record = memoryStore_js_1.memoryStore.resetTokens.get(token);
        let userId = null;
        if (record) {
            if (Date.now() > record.expiresAt) {
                memoryStore_js_1.memoryStore.resetTokens.delete(token);
                throw new errorHandler_js_1.AppError('Password reset token has expired. Please request a new one.', 400, 'TOKEN_EXPIRED');
            }
            userId = record.userId;
            memoryStore_js_1.memoryStore.resetTokens.delete(token);
        }
        else if (token === 'demo-reset-token') {
            // Support demo token for testing preview
            userId = 'usr_demo_01';
        }
        else {
            throw new errorHandler_js_1.AppError('Invalid or expired password reset token.', 400, 'INVALID_TOKEN');
        }
        const user = memoryStore_js_1.memoryStore.users.get(userId);
        if (!user) {
            throw new errorHandler_js_1.AppError('User not found for this reset token.', 404, 'USER_NOT_FOUND');
        }
        // Hash and persist new password
        const newHash = await bcryptjs_1.default.hash(newPassword, 8);
        user.passwordHash = newHash;
        user.updatedAt = new Date().toISOString();
        memoryStore_js_1.memoryStore.users.set(user.id, user);
        return {
            message: 'Password has been successfully updated. You may now sign in with your new credentials.',
        };
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;

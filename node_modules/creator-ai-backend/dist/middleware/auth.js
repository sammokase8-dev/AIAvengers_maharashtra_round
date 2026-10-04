"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const errorHandler_js_1 = require("./errorHandler.js");
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new errorHandler_js_1.AppError('Authentication token missing or invalid', 401, 'UNAUTHORIZED'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.jwtSecret);
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new errorHandler_js_1.AppError('Token has expired. Please sign in again.', 401, 'TOKEN_EXPIRED'));
        }
        return next(new errorHandler_js_1.AppError('Invalid authentication token', 401, 'INVALID_TOKEN'));
    }
};
exports.requireAuth = requireAuth;
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        if (env_js_1.config.nodeEnv === 'production') {
            return next(new errorHandler_js_1.AppError('Authentication is required.', 401, 'UNAUTHORIZED'));
        }
        return next();
    }
    if (!authHeader.startsWith('Bearer ')) {
        return next(new errorHandler_js_1.AppError('Authentication token is invalid.', 401, 'INVALID_TOKEN'));
    }
    const token = authHeader.slice('Bearer '.length);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.jwtSecret);
        req.user = decoded;
    }
    catch (err) {
        const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        const message = err.name === 'TokenExpiredError' ? 'Authentication token has expired.' : 'Authentication token is invalid.';
        return next(new errorHandler_js_1.AppError(message, 401, code));
    }
    next();
};
exports.optionalAuth = optionalAuth;

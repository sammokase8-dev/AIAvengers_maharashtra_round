"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformAdapters = void 0;
const errorHandler_js_1 = require("../middleware/errorHandler.js");
class UnconfiguredPlatformAdapter {
    platform;
    constructor(platform) {
        this.platform = platform;
    }
    isConfigured() {
        return false;
    }
    async connect() {
        throw new errorHandler_js_1.AppError(`${this.platform} is not connected: OAuth credentials and callback configuration are not set up.`, 503, 'PLATFORM_NOT_CONFIGURED');
    }
    async disconnect() { }
    async validate() {
        return false;
    }
    async upload() {
        throw new errorHandler_js_1.AppError(`${this.platform} upload is not available until its platform adapter is configured.`, 503, 'PLATFORM_NOT_CONFIGURED');
    }
    async schedule() {
        throw new errorHandler_js_1.AppError(`${this.platform} scheduling is not available until its platform adapter is configured.`, 503, 'PLATFORM_NOT_CONFIGURED');
    }
    async publish() {
        throw new errorHandler_js_1.AppError(`${this.platform} publishing is not available until its platform adapter is configured.`, 503, 'PLATFORM_NOT_CONFIGURED');
    }
    async status() {
        throw new errorHandler_js_1.AppError(`${this.platform} status lookup is not available until its platform adapter is configured.`, 503, 'PLATFORM_NOT_CONFIGURED');
    }
    async analytics() {
        throw new errorHandler_js_1.AppError(`${this.platform} analytics is not available until its platform adapter is configured.`, 503, 'PLATFORM_NOT_CONFIGURED');
    }
}
const platforms = [
    'youtube',
    'youtube_shorts',
    'instagram_reels',
    'instagram_post',
    'tiktok',
    'linkedin',
    'x',
];
exports.platformAdapters = new Map(platforms.map((platform) => [platform, new UnconfiguredPlatformAdapter(platform)]));

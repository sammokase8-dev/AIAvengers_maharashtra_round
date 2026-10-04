"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishingService = void 0;
const memoryStore_js_1 = require("../db/memoryStore.js");
const uuid_1 = require("uuid");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const platformAdapter_js_1 = require("./platformAdapter.js");
class PublishingService {
    static async getConnections(userId) {
        return Array.from(memoryStore_js_1.memoryStore.connections.values())
            .filter((connection) => connection.userId === userId)
            .map((connection) => ({
            ...connection,
            connected: platformAdapter_js_1.platformAdapters.get(connection.platform)?.isConfigured() === true && connection.connected,
        }));
    }
    static async toggleConnection(userId, platform, connect, accountHandle) {
        const adapter = platformAdapter_js_1.platformAdapters.get(platform);
        if (!adapter)
            throw new errorHandler_js_1.AppError('Unsupported publishing platform.', 400, 'UNSUPPORTED_PLATFORM');
        if (connect && !adapter.isConfigured()) {
            await adapter.connect();
        }
        const key = `${userId}_${platform}`;
        let record = memoryStore_js_1.memoryStore.connections.get(key);
        if (!record) {
            record = {
                id: `conn_${(0, uuid_1.v4)().substring(0, 6)}`,
                userId,
                platform,
                accountHandle: undefined,
                accountName: undefined,
                connected: false,
                followerCount: 0,
                connectedAt: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }
        else {
            record.connected = connect;
            if (connect) {
                record.accountHandle = accountHandle || record.accountHandle;
                record.connectedAt = new Date().toISOString();
            }
            else {
                record.connectedAt = undefined;
            }
            record.updatedAt = new Date().toISOString();
        }
        memoryStore_js_1.memoryStore.connections.set(key, record);
        return record;
    }
    static async getScheduledPosts(userId) {
        return Array.from(memoryStore_js_1.memoryStore.schedules.values()).filter((s) => s.userId === userId);
    }
    static async schedulePost(userId, input) {
        if (!input.title.trim() || input.title.length > 300 || input.platforms.length === 0 ||
            input.platforms.some((platform) => !platformAdapter_js_1.platformAdapters.has(platform))) {
            throw new errorHandler_js_1.AppError('A title and at least one supported platform are required.', 400, 'BAD_REQUEST');
        }
        const scheduledAt = new Date(input.scheduledTime);
        if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
            throw new errorHandler_js_1.AppError('Scheduled publication time must be a valid future date.', 400, 'BAD_REQUEST');
        }
        if (input.projectId && memoryStore_js_1.memoryStore.projects.get(input.projectId)?.userId !== userId) {
            throw new errorHandler_js_1.AppError('Project not found.', 404, 'NOT_FOUND');
        }
        if (input.mediaUrl && !Array.from(memoryStore_js_1.memoryStore.assets.values()).some((asset) => asset.userId === userId && ['video', 'generated'].includes(asset.type) && asset.url === input.mediaUrl)) {
            throw new errorHandler_js_1.AppError('Scheduled media must be a video asset owned by this creator.', 404, 'ASSET_NOT_FOUND');
        }
        if (input.thumbnailUrl && !Array.from(memoryStore_js_1.memoryStore.assets.values()).some((asset) => asset.userId === userId && (asset.url === input.thumbnailUrl || asset.thumbnailUrl === input.thumbnailUrl))) {
            throw new errorHandler_js_1.AppError('Thumbnail must belong to an asset owned by this creator.', 404, 'ASSET_NOT_FOUND');
        }
        const schedule = {
            id: `sch_${(0, uuid_1.v4)().substring(0, 8)}`,
            userId,
            projectId: input.projectId,
            title: input.title,
            description: input.description,
            platforms: input.platforms,
            scheduledTime: input.scheduledTime,
            status: 'scheduled',
            thumbnailUrl: input.thumbnailUrl,
            mediaUrl: input.mediaUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        memoryStore_js_1.memoryStore.schedules.set(schedule.id, schedule);
        return schedule;
    }
    static async publishNow(userId, scheduleId) {
        const post = memoryStore_js_1.memoryStore.schedules.get(scheduleId);
        if (!post || post.userId !== userId)
            throw new errorHandler_js_1.AppError('Scheduled post not found', 404, 'NOT_FOUND');
        const adapters = post.platforms.map((platform) => platformAdapter_js_1.platformAdapters.get(platform));
        const unavailable = post.platforms.filter((_, index) => !adapters[index]?.isConfigured());
        if (unavailable.length > 0) {
            throw new errorHandler_js_1.AppError(`Not connected: no publishing adapter is configured for ${unavailable.join(', ')}. The post remains scheduled and has not been published.`, 503, 'PLATFORM_NOT_CONFIGURED');
        }
        if (!post.mediaUrl)
            throw new errorHandler_js_1.AppError('A media file is required before publishing.', 400, 'MEDIA_REQUIRED');
        const media = Array.from(memoryStore_js_1.memoryStore.assets.values()).find((asset) => asset.userId === userId && asset.url === post.mediaUrl && ['video', 'generated'].includes(asset.type));
        if (!media)
            throw new errorHandler_js_1.AppError('The scheduled media asset is no longer available.', 404, 'ASSET_NOT_FOUND');
        const publishedUrls = {};
        const externalPublicationIds = {};
        for (let index = 0; index < post.platforms.length; index += 1) {
            const platform = post.platforms[index];
            const adapter = adapters[index];
            if (!adapter || !await adapter.validate()) {
                throw new errorHandler_js_1.AppError(`${platform} is not connected or its credentials are invalid. No publication was recorded.`, 503, 'PLATFORM_NOT_CONFIGURED');
            }
            try {
                const result = await adapter.publish(media.url, {
                    title: post.title,
                    description: post.description || '',
                });
                const publicationUrl = new URL(result.url);
                if (!result.externalId || publicationUrl.protocol !== 'https:') {
                    throw new errorHandler_js_1.AppError(`${platform} returned an invalid external publication receipt.`, 502, 'INVALID_PUBLISH_RECEIPT');
                }
                publishedUrls[platform] = publicationUrl.toString();
                externalPublicationIds[platform] = result.externalId;
            }
            catch (error) {
                if (Object.keys(publishedUrls).length > 0) {
                    post.status = 'failed';
                    post.errorMessage = `Partial publication: ${Object.keys(publishedUrls).join(', ')} succeeded before another platform failed.`;
                    post.publishedUrls = publishedUrls;
                    post.externalPublicationIds = externalPublicationIds;
                    post.updatedAt = new Date().toISOString();
                    throw new errorHandler_js_1.AppError(post.errorMessage, 502, 'PARTIAL_PUBLISH_FAILURE');
                }
                throw error;
            }
        }
        post.status = 'published';
        post.publishedUrls = publishedUrls;
        post.externalPublicationIds = externalPublicationIds;
        post.errorMessage = undefined;
        post.updatedAt = new Date().toISOString();
        return { success: true, schedule: post };
    }
}
exports.PublishingService = PublishingService;
exports.default = PublishingService;

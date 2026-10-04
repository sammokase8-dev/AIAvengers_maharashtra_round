"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const memoryStore_js_1 = require("../db/memoryStore.js");
const videoService_js_1 = require("./videoService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
class StorageService {
    static async saveUploadedFile(file, userId, folderId) {
        const isVideo = file.mimetype.startsWith('video/');
        const isAudio = file.mimetype.startsWith('audio/');
        const isImage = file.mimetype.startsWith('image/');
        if (folderId && memoryStore_js_1.memoryStore.folders.get(folderId)?.userId !== userId) {
            throw new errorHandler_js_1.AppError('Asset folder not found.', 404, 'NOT_FOUND');
        }
        const type = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'document';
        const assetId = `ast_${(0, uuid_1.v4)().substring(0, 8)}`;
        const relativeUrl = `/uploads/${file.filename}`;
        let metadata = undefined;
        let thumbnailUrl = undefined;
        if (isVideo) {
            const probe = await videoService_js_1.VideoService.probe(file.path);
            metadata = probe;
            // Extract thumbnail
            const thumbName = `thumb_${assetId}.jpg`;
            try {
                thumbnailUrl = await videoService_js_1.VideoService.extractThumbnail(file.path, thumbName, 1.0);
            }
            catch (error) {
                console.warn('[Storage] Thumbnail extraction failed; uploaded video remains available without a thumbnail.', error);
            }
        }
        else if (isImage) {
            metadata = {
                format: path_1.default.extname(file.originalname).replace('.', '').toUpperCase(),
                aspectRatio: '16:9',
            };
            thumbnailUrl = relativeUrl;
        }
        const asset = {
            id: assetId,
            userId,
            folderId,
            name: file.originalname.replace(path_1.default.extname(file.originalname), ''),
            originalName: file.originalname,
            type,
            sizeBytes: file.size,
            mimeType: file.mimetype,
            url: relativeUrl,
            thumbnailUrl,
            isFavorite: false,
            tags: [type.toUpperCase(), 'Uploaded'],
            metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        memoryStore_js_1.memoryStore.assets.set(asset.id, asset);
        // Update user profile storage used
        const profile = Array.from(memoryStore_js_1.memoryStore.profiles.values()).find((p) => p.userId === userId);
        if (profile) {
            profile.storageUsedBytes += file.size;
        }
        return asset;
    }
    static getSignedUploadUrl(fileName, mimeType) {
        void fileName;
        void mimeType;
        throw new errorHandler_js_1.AppError('Signed storage uploads are not configured. Use the authenticated multipart upload endpoint.', 503, 'STORAGE_NOT_CONFIGURED');
    }
}
exports.StorageService = StorageService;
exports.default = StorageService;

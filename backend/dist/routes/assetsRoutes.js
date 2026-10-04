"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetsRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const upload_js_1 = require("../middleware/upload.js");
const memoryStore_js_1 = require("../db/memoryStore.js");
const storageService_js_1 = require("../services/storageService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const uuid_1 = require("uuid");
exports.assetsRoutes = (0, express_1.Router)();
// GET /api/assets
exports.assetsRoutes.get('/', auth_js_1.optionalAuth, (req, res) => {
    const userId = req.user?.id || 'usr_demo_01';
    const { type, folderId, search, sortBy, sortOrder, favoriteOnly, tag } = req.query;
    let items = Array.from(memoryStore_js_1.memoryStore.assets.values()).filter((a) => a.userId === userId);
    if (type && type !== 'all') {
        items = items.filter((a) => a.type === type);
    }
    if (folderId && folderId !== 'all') {
        items = items.filter((a) => a.folderId === folderId);
    }
    if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        items = items.filter((a) => a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (favoriteOnly === 'true') {
        items = items.filter((a) => a.isFavorite);
    }
    if (tag && typeof tag === 'string') {
        items = items.filter((a) => a.tags.includes(tag));
    }
    if (sortBy === 'name') {
        items.sort((a, b) => (sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
    }
    else {
        items.sort((a, b) => (sortOrder === 'asc' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
    }
    res.json({ success: true, data: items });
});
// POST /api/assets/upload (Real file upload)
exports.assetsRoutes.post('/upload', auth_js_1.optionalAuth, upload_js_1.upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new errorHandler_js_1.AppError('No file provided in form-data payload', 400, 'NO_FILE');
        }
        const userId = req.user?.id || 'usr_demo_01';
        const folderId = req.body.folderId;
        if (folderId && memoryStore_js_1.memoryStore.folders.get(folderId)?.userId !== userId) {
            throw new errorHandler_js_1.AppError('Asset folder not found', 404, 'NOT_FOUND');
        }
        const asset = await storageService_js_1.StorageService.saveUploadedFile(req.file, userId, folderId);
        res.status(201).json({
            success: true,
            data: asset,
            message: 'Asset uploaded and processed successfully',
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/assets/upload-url (Signed upload url request)
exports.assetsRoutes.post('/upload-url', auth_js_1.optionalAuth, (req, res) => {
    const { fileName = 'media.mp4', mimeType = 'video/mp4' } = req.body;
    const result = storageService_js_1.StorageService.getSignedUploadUrl(fileName, mimeType);
    res.json({ success: true, data: result });
});
// GET /api/assets/folders
exports.assetsRoutes.get('/folders', auth_js_1.optionalAuth, (req, res) => {
    const userId = req.user?.id || 'usr_demo_01';
    const folders = Array.from(memoryStore_js_1.memoryStore.folders.values()).filter((folder) => folder.userId === userId);
    res.json({ success: true, data: folders });
});
exports.assetsRoutes.get('/:id', auth_js_1.optionalAuth, (req, res, next) => {
    const asset = memoryStore_js_1.memoryStore.assets.get(req.params.id);
    if (!asset || asset.userId !== (req.user?.id || 'usr_demo_01')) {
        return next(new errorHandler_js_1.AppError('Asset not found', 404, 'NOT_FOUND'));
    }
    res.json({ success: true, data: asset });
});
// POST /api/assets/folders
exports.assetsRoutes.post('/folders', auth_js_1.optionalAuth, (req, res, next) => {
    const userId = req.user?.id || 'usr_demo_01';
    const { name, color = '#3B82F6' } = req.body;
    if (typeof name !== 'string' || !name.trim() || name.length > 100 ||
        typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
        return next(new errorHandler_js_1.AppError('Folder name and color are invalid.', 400, 'BAD_REQUEST'));
    }
    const folder = {
        id: `fld_${(0, uuid_1.v4)().substring(0, 6)}`,
        userId,
        name: name.trim(),
        color,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    memoryStore_js_1.memoryStore.folders.set(folder.id, folder);
    res.status(201).json({ success: true, data: folder });
});
exports.assetsRoutes.post('/move', auth_js_1.optionalAuth, (req, res, next) => {
    const { assetIds, folderId } = req.body;
    if (!Array.isArray(assetIds) || assetIds.length === 0 || !assetIds.every((id) => typeof id === 'string')) {
        return next(new errorHandler_js_1.AppError('A non-empty list of asset IDs is required', 400, 'BAD_REQUEST'));
    }
    const assets = assetIds.map((id) => memoryStore_js_1.memoryStore.assets.get(id));
    if (assets.some((asset) => !asset)) {
        return next(new errorHandler_js_1.AppError('One or more assets were not found', 404, 'NOT_FOUND'));
    }
    const userId = req.user?.id || 'usr_demo_01';
    if (folderId && memoryStore_js_1.memoryStore.folders.get(folderId)?.userId !== userId) {
        return next(new errorHandler_js_1.AppError('Asset folder not found', 404, 'NOT_FOUND'));
    }
    if (assets.some((asset) => asset?.userId !== userId)) {
        return next(new errorHandler_js_1.AppError('One or more assets were not found', 404, 'NOT_FOUND'));
    }
    const updatedAt = new Date().toISOString();
    for (const asset of assets) {
        if (asset) {
            asset.folderId = folderId || undefined;
            asset.updatedAt = updatedAt;
        }
    }
    res.json({ success: true, data: { success: true } });
});
exports.assetsRoutes.post('/delete-batch', auth_js_1.optionalAuth, (req, res, next) => {
    const { assetIds } = req.body;
    if (!Array.isArray(assetIds) || assetIds.length === 0 || !assetIds.every((id) => typeof id === 'string')) {
        return next(new errorHandler_js_1.AppError('A non-empty list of asset IDs is required', 400, 'BAD_REQUEST'));
    }
    const userId = req.user?.id || 'usr_demo_01';
    if (assetIds.some((id) => memoryStore_js_1.memoryStore.assets.get(id)?.userId !== userId)) {
        return next(new errorHandler_js_1.AppError('One or more assets were not found', 404, 'NOT_FOUND'));
    }
    for (const id of assetIds) {
        memoryStore_js_1.memoryStore.assets.delete(id);
    }
    res.json({ success: true, data: { success: true } });
});
// PATCH /api/assets/:id
exports.assetsRoutes.patch('/:id', auth_js_1.optionalAuth, (req, res, next) => {
    const assetId = req.params.id;
    const asset = memoryStore_js_1.memoryStore.assets.get(assetId);
    if (!asset || asset.userId !== (req.user?.id || 'usr_demo_01')) {
        return next(new errorHandler_js_1.AppError('Asset not found', 404, 'NOT_FOUND'));
    }
    if (req.body.name !== undefined) {
        if (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.length > 255) {
            return next(new errorHandler_js_1.AppError('Asset name must be between 1 and 255 characters.', 400, 'BAD_REQUEST'));
        }
        asset.name = req.body.name.trim();
    }
    if (req.body.isFavorite !== undefined) {
        if (typeof req.body.isFavorite !== 'boolean')
            return next(new errorHandler_js_1.AppError('isFavorite must be a boolean.', 400, 'BAD_REQUEST'));
        asset.isFavorite = req.body.isFavorite;
    }
    if (req.body.folderId !== undefined) {
        if (req.body.folderId !== null &&
            (typeof req.body.folderId !== 'string' || memoryStore_js_1.memoryStore.folders.get(req.body.folderId)?.userId !== asset.userId)) {
            return next(new errorHandler_js_1.AppError('Asset folder not found.', 404, 'NOT_FOUND'));
        }
        asset.folderId = req.body.folderId || undefined;
    }
    asset.updatedAt = new Date().toISOString();
    res.json({ success: true, data: asset, message: 'Asset updated successfully' });
});
// DELETE /api/assets/:id
exports.assetsRoutes.delete('/:id', auth_js_1.optionalAuth, (req, res, next) => {
    const assetId = req.params.id;
    const asset = memoryStore_js_1.memoryStore.assets.get(assetId);
    if (!asset || asset.userId !== (req.user?.id || 'usr_demo_01')) {
        return next(new errorHandler_js_1.AppError('Asset not found', 404, 'NOT_FOUND'));
    }
    memoryStore_js_1.memoryStore.assets.delete(assetId);
    res.json({ success: true, message: 'Asset deleted successfully' });
});
exports.default = exports.assetsRoutes;

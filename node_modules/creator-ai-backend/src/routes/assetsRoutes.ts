import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { memoryStore, AssetFolderRecord } from '../db/memoryStore.js';
import { StorageService } from '../services/storageService.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export const assetsRoutes = Router();

// GET /api/assets
assetsRoutes.get('/', optionalAuth, (req: Request, res: Response) => {
  const userId = req.user?.id || 'usr_demo_01';
  const { type, folderId, search, sortBy, sortOrder, favoriteOnly, tag } = req.query;

  let items = Array.from(memoryStore.assets.values()).filter((a) => a.userId === userId);

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
  } else {
    items.sort((a, b) => (sortOrder === 'asc' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  }

  res.json({ success: true, data: items });
});

// POST /api/assets/upload (Real file upload)
assetsRoutes.post('/upload', optionalAuth, upload.single('file'), async (req: Request, res: Response, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file provided in form-data payload', 400, 'NO_FILE');
    }
    const userId = req.user?.id || 'usr_demo_01';
    const folderId = req.body.folderId;
    if (folderId && memoryStore.folders.get(folderId)?.userId !== userId) {
      throw new AppError('Asset folder not found', 404, 'NOT_FOUND');
    }
    const asset = await StorageService.saveUploadedFile(req.file, userId, folderId);

    res.status(201).json({
      success: true,
      data: asset,
      message: 'Asset uploaded and processed successfully',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/assets/upload-url (Signed upload url request)
assetsRoutes.post('/upload-url', optionalAuth, (req: Request, res: Response) => {
  const { fileName = 'media.mp4', mimeType = 'video/mp4' } = req.body;
  const result = StorageService.getSignedUploadUrl(fileName, mimeType);
  res.json({ success: true, data: result });
});

// GET /api/assets/folders
assetsRoutes.get('/folders', optionalAuth, (req: Request, res: Response) => {
  const userId = req.user?.id || 'usr_demo_01';
  const folders = Array.from(memoryStore.folders.values()).filter((folder) => folder.userId === userId);
  res.json({ success: true, data: folders });
});

assetsRoutes.get('/:id', optionalAuth, (req: Request, res: Response, next) => {
  const asset = memoryStore.assets.get(req.params.id as string);
  if (!asset || asset.userId !== (req.user?.id || 'usr_demo_01')) {
    return next(new AppError('Asset not found', 404, 'NOT_FOUND'));
  }
  res.json({ success: true, data: asset });
});

// POST /api/assets/folders
assetsRoutes.post('/folders', optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id || 'usr_demo_01';
  const { name, color = '#3B82F6' } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.length > 100 ||
      typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return next(new AppError('Folder name and color are invalid.', 400, 'BAD_REQUEST'));
  }
  const folder: AssetFolderRecord = {
    id: `fld_${uuidv4().substring(0, 6)}`,
    userId,
    name: name.trim(),
    color,
    itemCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memoryStore.folders.set(folder.id, folder);
  res.status(201).json({ success: true, data: folder });
});

assetsRoutes.post('/move', optionalAuth, (req: Request, res: Response, next) => {
  const { assetIds, folderId } = req.body as { assetIds?: unknown; folderId?: string | null };
  if (!Array.isArray(assetIds) || assetIds.length === 0 || !assetIds.every((id) => typeof id === 'string')) {
    return next(new AppError('A non-empty list of asset IDs is required', 400, 'BAD_REQUEST'));
  }

  const assets = assetIds.map((id) => memoryStore.assets.get(id));
  if (assets.some((asset) => !asset)) {
    return next(new AppError('One or more assets were not found', 404, 'NOT_FOUND'));
  }
  const userId = req.user?.id || 'usr_demo_01';
  if (folderId && memoryStore.folders.get(folderId)?.userId !== userId) {
    return next(new AppError('Asset folder not found', 404, 'NOT_FOUND'));
  }
  if (assets.some((asset) => asset?.userId !== userId)) {
    return next(new AppError('One or more assets were not found', 404, 'NOT_FOUND'));
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

assetsRoutes.post('/delete-batch', optionalAuth, (req: Request, res: Response, next) => {
  const { assetIds } = req.body as { assetIds?: unknown };
  if (!Array.isArray(assetIds) || assetIds.length === 0 || !assetIds.every((id) => typeof id === 'string')) {
    return next(new AppError('A non-empty list of asset IDs is required', 400, 'BAD_REQUEST'));
  }
  const userId = req.user?.id || 'usr_demo_01';
  if (assetIds.some((id) => memoryStore.assets.get(id)?.userId !== userId)) {
    return next(new AppError('One or more assets were not found', 404, 'NOT_FOUND'));
  }
  for (const id of assetIds) {
    memoryStore.assets.delete(id);
  }
  res.json({ success: true, data: { success: true } });
});

// PATCH /api/assets/:id
assetsRoutes.patch('/:id', optionalAuth, (req: Request, res: Response, next) => {
  const assetId = req.params.id as string;
  const asset = memoryStore.assets.get(assetId);
  if (!asset || asset.userId !== (req.user?.id || 'usr_demo_01')) {
    return next(new AppError('Asset not found', 404, 'NOT_FOUND'));
  }

  if (req.body.name !== undefined) {
    if (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.length > 255) {
      return next(new AppError('Asset name must be between 1 and 255 characters.', 400, 'BAD_REQUEST'));
    }
    asset.name = req.body.name.trim();
  }
  if (req.body.isFavorite !== undefined) {
    if (typeof req.body.isFavorite !== 'boolean') return next(new AppError('isFavorite must be a boolean.', 400, 'BAD_REQUEST'));
    asset.isFavorite = req.body.isFavorite;
  }
  if (req.body.folderId !== undefined) {
    if (req.body.folderId !== null &&
        (typeof req.body.folderId !== 'string' || memoryStore.folders.get(req.body.folderId)?.userId !== asset.userId)) {
      return next(new AppError('Asset folder not found.', 404, 'NOT_FOUND'));
    }
    asset.folderId = req.body.folderId || undefined;
  }
  asset.updatedAt = new Date().toISOString();

  res.json({ success: true, data: asset, message: 'Asset updated successfully' });
});

// DELETE /api/assets/:id
assetsRoutes.delete('/:id', optionalAuth, (req: Request, res: Response, next) => {
  const assetId = req.params.id as string;
  const asset = memoryStore.assets.get(assetId);
  if (!asset || asset.userId !== (req.user?.id || 'usr_demo_01')) {
    return next(new AppError('Asset not found', 404, 'NOT_FOUND'));
  }
  memoryStore.assets.delete(assetId);
  res.json({ success: true, message: 'Asset deleted successfully' });
});

export default assetsRoutes;

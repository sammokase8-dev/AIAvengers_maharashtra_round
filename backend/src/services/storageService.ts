import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { memoryStore, AssetRecord } from '../db/memoryStore.js';
import { VideoService } from './videoService.js';
import { AppError } from '../middleware/errorHandler.js';

export class StorageService {
  public static async saveUploadedFile(
    file: Express.Multer.File,
    userId: string,
    folderId?: string
  ): Promise<AssetRecord> {
    const isVideo = file.mimetype.startsWith('video/');
    const isAudio = file.mimetype.startsWith('audio/');
    const isImage = file.mimetype.startsWith('image/');
    if (folderId && memoryStore.folders.get(folderId)?.userId !== userId) {
      throw new AppError('Asset folder not found.', 404, 'NOT_FOUND');
    }

    const type = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'document';
    const assetId = `ast_${uuidv4().substring(0, 8)}`;
    const relativeUrl = `/uploads/${file.filename}`;

    let metadata: any = undefined;
    let thumbnailUrl: string | undefined = undefined;

    if (isVideo) {
      const probe = await VideoService.probe(file.path);
      metadata = probe;

      // Extract thumbnail
      const thumbName = `thumb_${assetId}.jpg`;
      try {
        thumbnailUrl = await VideoService.extractThumbnail(file.path, thumbName, 1.0);
      } catch (error) {
        console.warn('[Storage] Thumbnail extraction failed; uploaded video remains available without a thumbnail.', error);
      }
    } else if (isImage) {
      metadata = {
        format: path.extname(file.originalname).replace('.', '').toUpperCase(),
        aspectRatio: '16:9',
      };
      thumbnailUrl = relativeUrl;
    }

    const asset: AssetRecord = {
      id: assetId,
      userId,
      folderId,
      name: file.originalname.replace(path.extname(file.originalname), ''),
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

    memoryStore.assets.set(asset.id, asset);

    // Update user profile storage used
    const profile = Array.from(memoryStore.profiles.values()).find((p) => p.userId === userId);
    if (profile) {
      profile.storageUsedBytes += file.size;
    }

    return asset;
  }

  public static getSignedUploadUrl(fileName: string, mimeType: string) {
    void fileName;
    void mimeType;
    throw new AppError('Signed storage uploads are not configured. Use the authenticated multipart upload endpoint.', 503, 'STORAGE_NOT_CONFIGURED');
  }
}
export default StorageService;

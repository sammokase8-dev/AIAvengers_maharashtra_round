import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

export const resolveLocalMediaPath = (assetUrl: string): string => {
  const root = assetUrl.startsWith('/uploads/')
    ? path.resolve(config.localStorageDir)
    : assetUrl.startsWith('/media/')
      ? path.resolve(process.cwd(), '../frontend/public/media')
      : undefined;

  if (!root) {
    throw new AppError('This asset is not stored in supported local media storage.', 422, 'UNSUPPORTED_ASSET_STORAGE');
  }

  const resolved = path.resolve(root, path.basename(assetUrl));
  if (!resolved.startsWith(`${root}${path.sep}`) || !fs.existsSync(resolved)) {
    throw new AppError('The source media file is missing or outside the configured media store.', 404, 'SOURCE_FILE_NOT_FOUND');
  }
  return resolved;
};

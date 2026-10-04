import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { AppError } from './errorHandler.js';

// Ensure upload directory exists
const uploadDir = path.resolve(config.localStorageDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extensionByMime: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'video/mpeg': '.mpeg',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/aac': '.aac',
      'audio/ogg': '.ogg',
      'audio/mp3': '.mp3',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
    };
    const ext = extensionByMime[file.mimetype] || path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    // Video
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/mpeg',
    // Image
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/aac',
    'audio/ogg',
    'audio/mp3',
    // Document
    'application/pdf',
    'text/plain',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported file type: ${file.mimetype}. Please upload a video, audio, image, or document.`, 400, 'UNSUPPORTED_FILE_TYPE'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max limit
    files: 1,
    fields: 10,
  },
});

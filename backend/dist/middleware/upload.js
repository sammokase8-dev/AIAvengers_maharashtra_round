"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const env_js_1 = require("../config/env.js");
const errorHandler_js_1 = require("./errorHandler.js");
// Ensure upload directory exists
const uploadDir = path_1.default.resolve(env_js_1.config.localStorageDir);
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extensionByMime = {
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
        const ext = extensionByMime[file.mimetype] || path_1.default.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${(0, uuid_1.v4)().substring(0, 8)}${ext}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new errorHandler_js_1.AppError(`Unsupported file type: ${file.mimetype}. Please upload a video, audio, image, or document.`, 400, 'UNSUPPORTED_FILE_TYPE'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500 MB max limit
        files: 1,
        fields: 10,
    },
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLocalMediaPath = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_js_1 = require("../config/env.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const resolveLocalMediaPath = (assetUrl) => {
    const root = assetUrl.startsWith('/uploads/')
        ? path_1.default.resolve(env_js_1.config.localStorageDir)
        : assetUrl.startsWith('/media/')
            ? path_1.default.resolve(process.cwd(), '../frontend/public/media')
            : undefined;
    if (!root) {
        throw new errorHandler_js_1.AppError('This asset is not stored in supported local media storage.', 422, 'UNSUPPORTED_ASSET_STORAGE');
    }
    const resolved = path_1.default.resolve(root, path_1.default.basename(assetUrl));
    if (!resolved.startsWith(`${root}${path_1.default.sep}`) || !fs_1.default.existsSync(resolved)) {
        throw new errorHandler_js_1.AppError('The source media file is missing or outside the configured media store.', 404, 'SOURCE_FILE_NOT_FOUND');
    }
    return resolved;
};
exports.resolveLocalMediaPath = resolveLocalMediaPath;

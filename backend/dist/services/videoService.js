"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const ffprobe_1 = __importDefault(require("@ffprobe-installer/ffprobe"));
const crypto_1 = require("crypto");
const memoryStore_js_1 = require("../db/memoryStore.js");
const env_js_1 = require("../config/env.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const mediaPath_js_1 = require("./mediaPath.js");
if (ffmpeg_1.default?.path)
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
if (ffprobe_1.default?.path)
    fluent_ffmpeg_1.default.setFfprobePath(ffprobe_1.default.path);
const round = (value) => Math.round(value * 1000) / 1000;
const timestamp = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = (seconds % 60).toFixed(3).padStart(6, '0');
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${remainder.replace('.', ',')}`;
};
const escapeFilterPath = (value) => value.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,');
class VideoService {
    static async hasAudioStream(filePath) {
        return new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
                if (err || !metadata)
                    return reject(new errorHandler_js_1.AppError(`Unable to inspect audio asset${err ? `: ${err.message}` : '.'}`, 422, 'VIDEO_PROBE_FAILED'));
                resolve(metadata.streams.some((stream) => stream.codec_type === 'audio'));
            });
        });
    }
    static async probe(filePath) {
        if (!fs_1.default.existsSync(filePath)) {
            throw new errorHandler_js_1.AppError('The source video file does not exist.', 404, 'SOURCE_FILE_NOT_FOUND');
        }
        return new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
                if (err || !metadata?.format) {
                    return reject(new errorHandler_js_1.AppError(`Unable to inspect source video${err ? `: ${err.message}` : '.'}`, 422, 'VIDEO_PROBE_FAILED'));
                }
                const videoStream = metadata.streams.find((stream) => stream.codec_type === 'video');
                if (!videoStream)
                    return reject(new errorHandler_js_1.AppError('The source file has no video stream.', 422, 'INVALID_VIDEO'));
                const duration = Number(metadata.format.duration);
                if (!Number.isFinite(duration) || duration <= 0) {
                    return reject(new errorHandler_js_1.AppError('The source video has no valid duration.', 422, 'INVALID_VIDEO'));
                }
                let fps = 30;
                const frameRate = videoStream.r_frame_rate;
                if (typeof frameRate === 'string') {
                    const [numerator, denominator] = frameRate.split('/').map(Number);
                    if (denominator > 0 && numerator > 0)
                        fps = numerator / denominator;
                }
                const width = videoStream.width || 0;
                const height = videoStream.height || 0;
                resolve({
                    duration,
                    width,
                    height,
                    fps: Math.round(fps),
                    bitrate: metadata.format.bit_rate ? Number(metadata.format.bit_rate) : undefined,
                    resolution: `${width}x${height}`,
                    format: metadata.format.format_name || 'unknown',
                    hasAudio: metadata.streams.some((stream) => stream.codec_type === 'audio'),
                });
            });
        });
    }
    static async extractThumbnail(videoPath, outputFilename, seekSeconds = 1) {
        const uploadDir = path_1.default.resolve(env_js_1.config.localStorageDir);
        const filename = path_1.default.basename(outputFilename);
        if (!Number.isFinite(seekSeconds) || seekSeconds < 0) {
            throw new errorHandler_js_1.AppError('Thumbnail timestamp must be a non-negative number.', 400, 'BAD_REQUEST');
        }
        await fs_1.default.promises.mkdir(uploadDir, { recursive: true });
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(videoPath)
                .screenshots({ timestamps: [seekSeconds], filename, folder: uploadDir, size: '640x360' })
                .on('end', () => resolve(`/uploads/${filename}`))
                .on('error', (err) => reject(new errorHandler_js_1.AppError(`Thumbnail extraction failed: ${err.message}`, 422, 'THUMBNAIL_FAILED')));
        });
    }
    static async renderTimeline(timelineData, onProgress, userId = 'usr_demo_01', exportResolution = '1080p', persistTimeline = true) {
        if (!Array.isArray(timelineData.clips) || timelineData.clips.length === 0) {
            throw new errorHandler_js_1.AppError('Add at least one video clip to the timeline before rendering.', 422, 'EMPTY_TIMELINE');
        }
        const project = memoryStore_js_1.memoryStore.projects.get(timelineData.projectId);
        if (!project || project.userId !== userId)
            throw new errorHandler_js_1.AppError('Project not found.', 404, 'NOT_FOUND');
        if (timelineData.clips.some((clip) => clip.trackIndex !== 0)) {
            throw new errorHandler_js_1.AppError('Rendering currently supports the primary video track only.', 422, 'UNSUPPORTED_TIMELINE_TRACK');
        }
        if ((timelineData.overlays || []).some((overlay) => overlay.type !== 'text')) {
            throw new errorHandler_js_1.AppError('Image and sticker overlays are not supported by this renderer yet.', 422, 'UNSUPPORTED_OVERLAY');
        }
        const dimensions = {
            '16:9': exportResolution === '4k' ? [3840, 2160] : [1920, 1080],
            '9:16': exportResolution === '4k' ? [2160, 3840] : [1080, 1920],
            '1:1': [1080, 1080],
            '4:5': [1080, 1350],
        };
        const size = dimensions[timelineData.aspectRatio];
        if (!size || !['1080p', '4k'].includes(exportResolution)) {
            throw new errorHandler_js_1.AppError('Unsupported output aspect ratio or resolution preset.', 400, 'BAD_REQUEST');
        }
        const sortedClips = [...timelineData.clips].sort((a, b) => a.timelineStart - b.timelineStart);
        const prepared = [];
        let cursor = 0;
        for (const clip of sortedClips) {
            const asset = memoryStore_js_1.memoryStore.assets.get(clip.sourceAssetId);
            if (!asset || asset.userId !== userId || asset.type !== 'video') {
                throw new errorHandler_js_1.AppError('A timeline source video was not found.', 404, 'ASSET_NOT_FOUND');
            }
            const start = Number(clip.startTime);
            const end = Number(clip.endTime);
            const speed = Number(clip.speed);
            const volume = Number(clip.volume);
            const timelineStart = Number(clip.timelineStart);
            if (![start, end, speed, volume, timelineStart].every(Number.isFinite) ||
                start < 0 || end <= start || speed < 0.5 || speed > 2 || volume < 0 || volume > 2 ||
                Math.abs(timelineStart - cursor) > 0.05) {
                throw new errorHandler_js_1.AppError('Timeline trims, playback settings, or clip placement are invalid.', 400, 'INVALID_TIMELINE');
            }
            const sourcePath = (0, mediaPath_js_1.resolveLocalMediaPath)(asset.url);
            const metadata = await this.probe(sourcePath);
            if (end > metadata.duration + 0.05) {
                throw new errorHandler_js_1.AppError('A timeline trim extends beyond its source video.', 400, 'INVALID_TIMELINE');
            }
            const duration = (end - start) / speed;
            prepared.push({ clip, sourcePath, metadata, start, end, speed, volume, duration });
            cursor += duration;
        }
        const uploadDir = path_1.default.resolve(env_js_1.config.localStorageDir);
        await fs_1.default.promises.mkdir(uploadDir, { recursive: true });
        const id = (0, crypto_1.randomUUID)();
        const outputFilename = `render_${id}.mp4`;
        const outputPath = path_1.default.join(uploadDir, outputFilename);
        const captionPath = path_1.default.join(uploadDir, `render_${id}.srt`);
        const overlayFiles = [];
        const command = (0, fluent_ffmpeg_1.default)();
        const filters = [];
        const videoLabels = [];
        const audioLabels = [];
        let nextInput = 0;
        for (let index = 0; index < prepared.length; index += 1) {
            const item = prepared[index];
            const videoInput = nextInput++;
            let cropFilter = '';
            if (item.clip.crop !== undefined) {
                const crop = item.clip.crop;
                const { x, y, width, height } = crop;
                if (![x, y, width, height].every((value) => typeof value === 'number' && Number.isFinite(value)) ||
                    x < 0 || y < 0 || width <= 0 || height <= 0 ||
                    x + width > 100 || y + height > 100) {
                    throw new errorHandler_js_1.AppError('Clip crop coordinates must be percentages within the source frame.', 400, 'INVALID_TIMELINE');
                }
                cropFilter = `crop=iw*${width / 100}:ih*${height / 100}:iw*${x / 100}:ih*${y / 100},`;
            }
            command.input(item.sourcePath);
            filters.push(`[${videoInput}:v]trim=start=${round(item.start)}:duration=${round(item.end - item.start)},` +
                `setpts=(PTS-STARTPTS)/${item.speed},` +
                cropFilter +
                `scale=${size[0]}:${size[1]}:force_original_aspect_ratio=decrease,` +
                `pad=${size[0]}:${size[1]}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${index}]`);
            videoLabels.push(`[v${index}]`);
            let audioInput = videoInput;
            if (!item.metadata.hasAudio) {
                audioInput = nextInput++;
                command.input(`anullsrc=channel_layout=stereo:sample_rate=48000`)
                    .inputFormat('lavfi')
                    .inputOptions('-t', String(round(item.end - item.start)));
            }
            filters.push(`[${audioInput}:a]atrim=start=${item.metadata.hasAudio ? round(item.start) : 0}:duration=${round(item.end - item.start)},` +
                `asetpts=PTS-STARTPTS,atempo=${item.speed},volume=${item.volume}[a${index}]`);
            audioLabels.push(`[a${index}]`);
        }
        filters.push(`${videoLabels.join('')}${audioLabels.join('')}concat=n=${prepared.length}:v=1:a=1[outv][outa]`);
        let audioOutput = 'outa';
        if (timelineData.audioTrack?.assetId) {
            const music = memoryStore_js_1.memoryStore.assets.get(timelineData.audioTrack.assetId);
            if (!music || music.userId !== userId || !['audio', 'video'].includes(music.type)) {
                throw new errorHandler_js_1.AppError('The timeline music asset was not found.', 404, 'ASSET_NOT_FOUND');
            }
            const musicPath = (0, mediaPath_js_1.resolveLocalMediaPath)(music.url);
            if (!await this.hasAudioStream(musicPath))
                throw new errorHandler_js_1.AppError('The selected music asset has no audio stream.', 422, 'INVALID_AUDIO');
            const musicInput = nextInput++;
            command.input(musicPath);
            const gain = Number(timelineData.audioTrack.volume);
            if (!Number.isFinite(gain) || gain < 0 || gain > 2) {
                throw new errorHandler_js_1.AppError('Music volume must be between 0 and 2.', 400, 'INVALID_TIMELINE');
            }
            const fadeIn = timelineData.audioTrack.fadeIn || 0;
            const fadeOut = timelineData.audioTrack.fadeOut || 0;
            if (![fadeIn, fadeOut].every(Number.isFinite) || fadeIn < 0 || fadeOut < 0 || fadeIn + fadeOut > cursor) {
                throw new errorHandler_js_1.AppError('Music fade durations must fit within the rendered timeline.', 400, 'INVALID_TIMELINE');
            }
            const musicFilters = [
                `atrim=duration=${round(cursor)}`,
                'asetpts=PTS-STARTPTS',
                `volume=${gain}`,
            ];
            if (fadeIn > 0)
                musicFilters.push(`afade=t=in:st=0:d=${round(fadeIn)}`);
            if (fadeOut > 0)
                musicFilters.push(`afade=t=out:st=${round(cursor - fadeOut)}:d=${round(fadeOut)}`);
            filters.push(`[${musicInput}:a]${musicFilters.join(',')}[music]`, `[outa][music]amix=inputs=2:duration=first:dropout_transition=0[mixed]`);
            audioOutput = 'mixed';
        }
        if (timelineData.captionTrack.length) {
            const captions = timelineData.captionTrack
                .map((caption, index) => {
                if (!Number.isFinite(caption.startTime) || !Number.isFinite(caption.endTime) ||
                    caption.startTime < 0 || caption.endTime <= caption.startTime || caption.endTime > cursor + 0.05) {
                    throw new errorHandler_js_1.AppError('Caption timestamps must fall within the rendered timeline.', 400, 'INVALID_TIMELINE');
                }
                return `${index + 1}\n${timestamp(caption.startTime)} --> ${timestamp(caption.endTime)}\n${caption.text.replace(/[\r\n]+/g, ' ').trim()}\n`;
            })
                .join('\n');
            await fs_1.default.promises.writeFile(captionPath, captions, 'utf8');
            filters.push(`[outv]subtitles='${escapeFilterPath(captionPath)}':force_style='Fontsize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Alignment=2'[captioned]`);
        }
        let videoOutput = timelineData.captionTrack.length ? 'captioned' : 'outv';
        for (const [index, overlay] of (timelineData.overlays || []).entries()) {
            const start = Number(overlay.startTime);
            const end = Number(overlay.endTime);
            const x = Number(overlay.x);
            const y = Number(overlay.y);
            if (![start, end, x, y].every(Number.isFinite) || start < 0 || end <= start || end > cursor + 0.05 ||
                x < 0 || x > 100 || y < 0 || y > 100 || overlay.content.length > 1000) {
                throw new errorHandler_js_1.AppError('Text overlay values or timestamps are invalid.', 400, 'INVALID_TIMELINE');
            }
            const textFile = path_1.default.join(uploadDir, `render_${id}_overlay_${index}.txt`);
            await fs_1.default.promises.writeFile(textFile, overlay.content, 'utf8');
            overlayFiles.push(textFile);
            const color = /^#[0-9a-fA-F]{6}$/.test(overlay.style?.color || '') ? overlay.style.color.slice(1) : 'FFFFFF';
            const fontSize = Number(overlay.style?.fontSize || 36);
            if (!Number.isFinite(fontSize) || fontSize < 12 || fontSize > 96) {
                throw new errorHandler_js_1.AppError('Text overlay font size must be between 12 and 96.', 400, 'INVALID_TIMELINE');
            }
            const nextVideo = `overlay${index}`;
            filters.push(`[${videoOutput}]drawtext=textfile='${escapeFilterPath(textFile)}':fontcolor=0x${color}:fontsize=${fontSize}:` +
                `x=w*${x / 100}:y=h*${y / 100}:enable='between(t,${start},${end})'[${nextVideo}]`);
            videoOutput = nextVideo;
        }
        if (onProgress)
            onProgress(15, 'Preparing timestamp-validated FFmpeg timeline');
        try {
            await new Promise((resolve, reject) => {
                command
                    .complexFilter(filters)
                    .outputOptions([
                    '-map', `[${videoOutput}]`,
                    '-map', `[${audioOutput}]`,
                    '-c:v', 'libx264',
                    '-preset', 'veryfast',
                    '-crf', '23',
                    '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac',
                    '-movflags', '+faststart',
                    '-t', String(round(cursor)),
                ])
                    .on('progress', (progress) => {
                    if (onProgress && typeof progress.percent === 'number' && Number.isFinite(progress.percent)) {
                        onProgress(15 + Math.min(80, Math.max(0, progress.percent * 0.8)), 'Encoding video and audio');
                    }
                })
                    .on('end', () => resolve())
                    .on('error', (err) => reject(new errorHandler_js_1.AppError(`FFmpeg rendering failed: ${err.message}`, 422, 'RENDER_FAILED')))
                    .save(outputPath);
            });
            const stat = await fs_1.default.promises.stat(outputPath);
            if (stat.size === 0)
                throw new errorHandler_js_1.AppError('FFmpeg returned an empty render file.', 500, 'RENDER_FAILED');
            const outputMetadata = await this.probe(outputPath);
            const lastSavedAt = new Date().toISOString();
            if (persistTimeline) {
                memoryStore_js_1.memoryStore.timelines.set(timelineData.projectId, { ...timelineData, lastSavedAt, updatedAt: lastSavedAt });
            }
            const renderedAssetId = `ast_${id.slice(0, 8)}`;
            let thumbnailUrl;
            try {
                thumbnailUrl = await this.extractThumbnail(outputPath, `thumb_${renderedAssetId}.jpg`, Math.min(1, outputMetadata.duration));
            }
            catch (error) {
                console.warn('[FFmpeg] Render completed, but thumbnail extraction failed.', error);
            }
            memoryStore_js_1.memoryStore.assets.set(renderedAssetId, {
                id: renderedAssetId,
                userId,
                name: `${project.title} - ${timelineData.aspectRatio} render`,
                originalName: outputFilename,
                type: 'generated',
                sizeBytes: stat.size,
                mimeType: 'video/mp4',
                url: `/uploads/${outputFilename}`,
                thumbnailUrl,
                isFavorite: false,
                tags: ['rendered', timelineData.aspectRatio],
                metadata: outputMetadata,
                createdAt: lastSavedAt,
                updatedAt: lastSavedAt,
            });
            if (onProgress)
                onProgress(100, 'Render completed');
            return { outputUrl: `/uploads/${outputFilename}`, duration: round(cursor), format: timelineData.aspectRatio };
        }
        catch (error) {
            try {
                await fs_1.default.promises.unlink(outputPath);
            }
            catch (cleanupError) {
                if (cleanupError.code !== 'ENOENT') {
                    console.error('[FFmpeg] Failed to remove an incomplete render file.', cleanupError);
                }
            }
            throw error;
        }
        finally {
            await Promise.all([captionPath, ...overlayFiles].map(async (file) => {
                try {
                    await fs_1.default.promises.unlink(file);
                }
                catch (error) {
                    if (error.code !== 'ENOENT')
                        throw error;
                }
            }));
        }
    }
}
exports.VideoService = VideoService;
exports.default = VideoService;

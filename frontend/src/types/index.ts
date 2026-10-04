// ==========================================
// CREATORAI CORE TYPES DEFINITIONS
// ==========================================

export type PlatformType =
  | 'youtube'
  | 'youtube_shorts'
  | 'instagram_reels'
  | 'instagram_post'
  | 'tiktok'
  | 'linkedin'
  | 'x';

export type JobStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

export type JobType =
  | 'video_upload'
  | 'transcription'
  | 'video_analysis'
  | 'clip_generation'
  | 'rendering'
  | 'ai_generation'
  | 'publish';

export interface RealTimeJob {
  id: string;
  type: JobType;
  title: string;
  status: JobStatus;
  progress: number; // 0 to 100
  message?: string;
  error?: string;
  resultUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// 1. AUTHENTICATION & CREATOR PROFILE
// ------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'creator' | 'editor' | 'admin';
  channelName?: string;
  niche?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface SocialConnection {
  platform: PlatformType;
  connected: boolean;
  handle?: string;
  followerCount?: number;
  avatarUrl?: string;
  connectedAt?: string;
}

export interface CreatorProfile extends User {
  bio?: string;
  primaryPlatform: PlatformType;
  connections: SocialConnection[];
  storageUsedBytes: number;
  storageLimitBytes: number;
}

// ------------------------------------------
// 2. ASSET LIBRARY
// ------------------------------------------

export type AssetType = 'video' | 'image' | 'audio' | 'document' | 'generated';

export interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  fps?: number;
  bitrate?: number;
  resolution?: string;
  format: string;
  hasAudio: boolean;
  thumbnailUrl?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  aspectRatio: string;
}

export interface AudioMetadata {
  duration: number; // in seconds
  format: string;
  bitrate?: number;
  sampleRate?: number;
  waveformUrl?: string;
}

export interface AssetFolder {
  id: string;
  name: string;
  color?: string;
  itemCount: number;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  originalName: string;
  type: AssetType;
  sizeBytes: number;
  url: string;
  thumbnailUrl?: string;
  folderId?: string;
  tags: string[];
  isFavorite: boolean;
  metadata?: VideoMetadata | ImageMetadata | AudioMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface UploadSignedUrlResponse {
  uploadUrl: string;
  assetId: string;
  fields?: Record<string, string>;
}

// ------------------------------------------
// 3. CONTENT PROJECTS & WORKSPACE
// ------------------------------------------

export type ProjectStatus =
  | 'idea'
  | 'draft'
  | 'editing'
  | 'review'
  | 'scheduled'
  | 'published';

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  niche?: string;
  targetPlatforms: PlatformType[];
  tags: string[];
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  stats?: {
    assetsCount: number;
    clipsCount: number;
    durationEstimate?: number;
  };
}

// ------------------------------------------
// 4. AI STUDIO
// ------------------------------------------

export type AIOperationType =
  | 'idea'
  | 'hook'
  | 'script'
  | 'caption'
  | 'cta'
  | 'plan'
  | 'repurpose';

export type ToneType =
  | 'authoritative'
  | 'conversational'
  | 'viral'
  | 'storyteller'
  | 'educational'
  | 'humorous';

export interface AIContentPayload {
  operation: AIOperationType;
  prompt: string;
  tone?: ToneType;
  targetPlatform?: PlatformType;
  niche?: string;
  referenceContent?: string;
  durationSeconds?: number;
}

export interface AIGeneratedContent {
  id: string;
  operation: AIOperationType;
  hook?: string;
  script?: string;
  caption?: string;
  cta?: string;
  contentPlan?: Array<{ day: number; topic: string; format: string; hook: string }>;
  tone: ToneType;
  platform?: PlatformType;
  estimatedDurationSeconds?: number;
  wordCount?: number;
  createdAt: string;
  isDemoData?: boolean;
  demoNotice?: string;
}

// ------------------------------------------
// 5. SCRIPT-TO-VIDEO
// ------------------------------------------

export interface ScriptSegment {
  id: string;
  sentenceIndex: number;
  text: string;
  suggestedBroll?: string;
  timestampEstimate?: { start: number; end: number };
}

export interface MatchedFootageSegment {
  id: string;
  scriptSegmentId: string;
  assetId: string;
  assetName: string;
  startTime: number; // seconds
  endTime: number; // seconds
  confidence?: number; // 0-1 (only if provided by backend AI)
  matchedKeywords?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'manual_adjusted';
  previewUrl?: string;
}

export interface TranscriptRecord {
  id: string;
  assetId: string;
  fullText: string;
  language: string;
  confidence: number;
  segments: Array<{
    id: string;
    startTime: number;
    endTime: number;
    text: string;
    confidence: number;
    words?: Array<{ word: string; start: number; end: number }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptMatchResult {
  projectId: string;
  scriptText: string;
  segments: ScriptSegment[];
  matchedFootage: MatchedFootageSegment[];
  totalMatches: number;
  unmatchedCount: number;
}

// ------------------------------------------
// 6. VIDEO EDITOR & TIMELINE
// ------------------------------------------

export interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
}

export interface OverlayItem {
  id: string;
  type: 'text' | 'image' | 'sticker';
  content: string;
  startTime: number;
  endTime: number;
  x: number; // percent 0-100
  y: number; // percent 0-100
  style?: {
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    fontFamily?: string;
    fontWeight?: string;
  };
}

export interface CaptionItem {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  words?: Array<{ word: string; start: number; end: number }>;
}

export interface TimelineClip {
  id: string;
  sourceAssetId: string;
  sourceAssetName: string;
  sourceUrl: string;
  startTime: number; // offset in source asset
  endTime: number; // cut end in source asset
  timelineStart: number; // placement on master timeline
  crop?: CropSettings;
  position?: { x: number; y: number; scale: number };
  speed: number; // e.g. 1.0, 1.25
  volume: number; // 0.0 to 1.0
  trackIndex: number; // 0=primary video, 1=broll, 2=overlay
}

// Editable AI Timeline Data Model (sent to backend FFmpeg renderer)
export interface EditModel {
  projectId: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  totalDuration: number;
  clips: TimelineClip[];
  captionTrack: CaptionItem[];
  overlays: OverlayItem[];
  audioTrack?: {
    assetId?: string;
    volume: number;
    fadeIn?: number;
    fadeOut?: number;
  };
  lastSavedAt: string;
}

// ------------------------------------------
// 7. CLIP GENERATOR
// ------------------------------------------

export interface GeneratedClip {
  id: string;
  sourceAssetId: string;
  title: string;
  hook: string;
  startTime: number;
  endTime: number;
  duration: number;
  selectionScore?: number; // Transcript selection heuristic, not a view prediction.
  reasoning?: string;
  recommendedPlatforms: PlatformType[];
  aspectRatio: '9:16' | '1:1' | '16:9';
  previewUrl?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_editor';
  createdAt: string;
}

// ------------------------------------------
// 8. MULTI-PLATFORM ADAPTATION
// ------------------------------------------

export interface PlatformAdaptationConfig {
  platform: PlatformType;
  aspectRatio: '9:16' | '1:1' | '16:9' | '4:5';
  title: string;
  description: string;
  hashtags: string[];
  ctaText: string;
  captionStyle: 'minimal' | 'bold_punchy' | 'subtitles_only' | 'karaoke_glow';
  maxDurationSeconds: number;
  trimStart?: number;
  trimEnd?: number;
  thumbnailTime?: number;
  status: 'draft' | 'ready' | 'exporting' | 'exported';
}

// ------------------------------------------
// 9. CONTENT CALENDAR & PUBLISHING
// ------------------------------------------

export type PublishingStatus =
  | 'draft'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed';

export interface ScheduledPost {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  platforms: PlatformType[];
  scheduledTime: string; // ISO string
  status: PublishingStatus;
  thumbnailUrl?: string;
  mediaUrl?: string;
  publishedUrls?: Partial<Record<PlatformType, string>>;
  errorMessage?: string;
  createdAt: string;
}

export type CalendarViewMode = 'month' | 'week' | 'list';

// ------------------------------------------
// 10. ANALYTICS
// ------------------------------------------

export interface MetricSummary {
  label: string;
  value: number | string;
  changePercent?: number;
  isPositive?: boolean;
  unit?: string;
}

export interface TimeSeriesPoint {
  date: string;
  views: number;
  engagement: number;
  watchTimeHours: number;
}

export interface PlatformMetric {
  platform: PlatformType;
  views: number;
  followers: number;
  growth: number;
  engagementRate: number;
}

export interface ContentPerformanceItem {
  id: string;
  title: string;
  platform: PlatformType;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  retentionPercent: number;
  thumbnailUrl?: string;
}

// ------------------------------------------
// 11. CREATOR INTELLIGENCE
// ------------------------------------------

export type InsightCategory =
  | 'performance'
  | 'patterns'
  | 'actions'
  | 'opportunities';

export type InsightSeverity = 'info' | 'positive' | 'warning' | 'high_impact';

export interface CreatorInsight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  severity: InsightSeverity;
  metricComparison?: {
    metric: string;
    currentValue: string;
    benchmarkValue: string;
  };
  recommendedAction?: string;
  createdAt: string;
}

// ------------------------------------------
// 12. API WRAPPER TYPES
// ------------------------------------------

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

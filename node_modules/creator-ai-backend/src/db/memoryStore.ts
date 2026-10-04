import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  role: 'creator' | 'editor' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface CreatorProfileRecord {
  id: string;
  userId: string;
  channelName: string;
  niche: string;
  bio: string;
  primaryPlatform: string;
  storageUsedBytes: number;
  storageLimitBytes: number;
  languagePreference: string;
  themePreference: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetRecord {
  id: string;
  userId: string;
  folderId?: string;
  name: string;
  originalName: string;
  type: 'video' | 'image' | 'audio' | 'document' | 'generated';
  sizeBytes: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  isFavorite: boolean;
  tags: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AssetFolderRecord {
  id: string;
  userId: string;
  name: string;
  color?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentProjectRecord {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'idea' | 'draft' | 'editing' | 'review' | 'scheduled' | 'published';
  niche?: string;
  targetPlatforms: string[];
  tags: string[];
  thumbnailUrl?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptRecord {
  id: string;
  projectId: string;
  title: string;
  rawText: string;
  tone: string;
  wordCount: number;
  durationSec: number;
  createdAt: string;
  updatedAt: string;
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

export interface ClipRecord {
  id: string;
  projectId?: string;
  sourceAssetId: string;
  title: string;
  hook: string;
  startTime: number;
  endTime: number;
  duration: number;
  selectionScore: number;
  reasoning: string;
  recommendedPlatforms: string[];
  aspectRatio: '9:16' | '16:9' | '1:1';
  previewUrl: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_editor';
  createdAt: string;
  updatedAt: string;
}

export interface TimelineRecord {
  id: string;
  projectId: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  totalDuration: number;
  clips: Array<{
    id: string;
    sourceAssetId: string;
    sourceAssetName: string;
    sourceUrl: string;
    startTime: number;
    endTime: number;
    timelineStart: number;
    speed: number;
    volume: number;
    trackIndex: number;
    crop?: any;
  }>;
  audioTrack?: {
    assetId?: string;
    volume: number;
    fadeIn?: number;
    fadeOut?: number;
  };
  captionTrack: Array<{
    id: string;
    startTime: number;
    endTime: number;
    text: string;
  }>;
  overlays: Array<{
    id: string;
    type: 'text' | 'image' | 'sticker';
    content: string;
    startTime: number;
    endTime: number;
    x: number;
    y: number;
    style?: {
      fontSize?: number;
      color?: string;
    };
  }>;
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConnectionRecord {
  id: string;
  userId: string;
  platform: string;
  accountHandle?: string;
  accountName?: string;
  avatarUrl?: string;
  connected: boolean;
  followerCount: number;
  connectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishingScheduleRecord {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  description?: string;
  platforms: string[];
  scheduledTime: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  thumbnailUrl?: string;
  mediaUrl?: string;
  publishedUrls?: Record<string, string>;
  externalPublicationIds?: Record<string, string>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSnapshotRecord {
  id: string;
  userId: string;
  date: string;
  views: number;
  engagement: number;
  watchTimeHours: number;
  likes: number;
  comments: number;
  shares: number;
  retentionPercent: number;
}

export interface AIInsightRecord {
  id: string;
  userId: string;
  category: 'performance' | 'patterns' | 'actions' | 'opportunities';
  title: string;
  description: string;
  severity: 'info' | 'positive' | 'warning' | 'high_impact';
  metricCurrent?: string;
  metricBenchmark?: string;
  recommendedAction?: string;
  isDismissed: boolean;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface JobRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  resultUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAdaptationRecord {
  id: string;
  userId?: string;
  projectId?: string;
  platform: string;
  aspectRatio: string;
  title: string;
  description: string;
  hashtags: string[];
  ctaText: string;
  captionStyle: string;
  maxDurationSeconds: number;
  status: 'draft' | 'ready' | 'rendering' | 'exported';
  outputUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export class MemoryStore {
  public users: Map<string, UserRecord> = new Map();
  public profiles: Map<string, CreatorProfileRecord> = new Map();
  public folders: Map<string, AssetFolderRecord> = new Map();
  public assets: Map<string, AssetRecord> = new Map();
  public projects: Map<string, ContentProjectRecord> = new Map();
  public scripts: Map<string, ScriptRecord> = new Map();
  public transcripts: Map<string, TranscriptRecord> = new Map();
  public clips: Map<string, ClipRecord> = new Map();
  public timelines: Map<string, TimelineRecord> = new Map();
  public connections: Map<string, PlatformConnectionRecord> = new Map();
  public schedules: Map<string, PublishingScheduleRecord> = new Map();
  public analytics: Map<string, AnalyticsSnapshotRecord[]> = new Map();
  public insights: Map<string, AIInsightRecord> = new Map();
  public notifications: Map<string, NotificationRecord> = new Map();
  public jobs: Map<string, JobRecord> = new Map();
  public resetTokens: Map<string, { token: string; userId: string; expiresAt: number }> = new Map();
  public adaptations: Map<string, PlatformAdaptationRecord> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  public seedDefaultData(): void {
    const demoUserId = 'usr_demo_01';
    // Precomputed bcrypt hash for 'Password123!'
    const demoPasswordHash = '$2b$08$CzuysNmztoYZLH9iJUNsjewP0dnaueXJ3TS9h53f0M/WrVJecJA/a';

    // 1. Seed Demo User
    const demoUser: UserRecord = {
      id: demoUserId,
      email: 'alex@creatorai.studio',
      passwordHash: demoPasswordHash,
      name: 'Demo Creator',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'creator',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(demoUser.id, demoUser);

    // 2. Creator Profile
    const demoProfile: CreatorProfileRecord = {
      id: 'prof_01',
      userId: demoUserId,
      channelName: 'The AI Studio',
      niche: 'AI & Creative Operations',
      bio: 'Deep dives on engineering creative production pipelines, non-destructive video editing, and modern creator intelligence.',
      primaryPlatform: 'youtube',
      storageUsedBytes: 4294967296, // 4 GB
      storageLimitBytes: 53687091200, // 50 GB
      languagePreference: 'en',
      themePreference: 'system',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(demoProfile.id, demoProfile);

    // 3. Asset Folders
    const folder1: AssetFolderRecord = {
      id: 'fld_01',
      userId: demoUserId,
      name: 'A-Roll Raw Takes',
      color: '#3B82F6',
      itemCount: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const folder2: AssetFolderRecord = {
      id: 'fld_02',
      userId: demoUserId,
      name: 'B-Roll & Visuals',
      color: '#10B981',
      itemCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.folders.set(folder1.id, folder1);
    this.folders.set(folder2.id, folder2);

    // 4. Assets (Using our actual local MP4s in /media)
    const asset1: AssetRecord = {
      id: 'ast_vid_01',
      userId: demoUserId,
      folderId: folder1.id,
      name: 'Episode 42 - The AI Engineering Shift (Take 1)',
      originalName: 'ep42_take1_uhd.mp4',
      type: 'video',
      sizeBytes: 788493,
      mimeType: 'video/mp4',
      url: '/media/demo_main.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
      isFavorite: true,
      tags: ['A-Roll', 'Main Studio', 'Episode 42', 'AI'],
      metadata: {
        duration: 12.3,
        width: 1920,
        height: 1080,
        fps: 30,
        resolution: '1080p',
        format: 'MP4',
        hasAudio: true,
      },
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const asset2: AssetRecord = {
      id: 'ast_vid_02',
      userId: demoUserId,
      folderId: folder2.id,
      name: 'Creative Studio B-Roll & Visual Transitions',
      originalName: 'broll_studio_setup.mp4',
      type: 'video',
      sizeBytes: 1128375,
      mimeType: 'video/mp4',
      url: '/media/demo_broll.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
      isFavorite: false,
      tags: ['B-Roll', 'Transitions', '4K'],
      metadata: {
        duration: 15.0,
        width: 1920,
        height: 1080,
        fps: 60,
        resolution: '1080p',
        format: 'MP4',
        hasAudio: false,
      },
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const asset3: AssetRecord = {
      id: 'ast_img_01',
      userId: demoUserId,
      folderId: folder2.id,
      name: 'High-Retention Thumbnail - The AI Shift',
      originalName: 'thumbnail_master.jpg',
      type: 'image',
      sizeBytes: 245000,
      mimeType: 'image/jpeg',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1280&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&auto=format&fit=crop&q=80',
      isFavorite: true,
      tags: ['Thumbnail', 'YouTube', 'V1'],
      metadata: {
        width: 1920,
        height: 1080,
        format: 'JPEG',
        aspectRatio: '16:9',
      },
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.assets.set(asset1.id, asset1);
    this.assets.set(asset2.id, asset2);
    this.assets.set(asset3.id, asset3);

    // 5. Projects
    const project1: ContentProjectRecord = {
      id: 'prj_01',
      userId: demoUserId,
      title: 'How AI Engineering Is Replacing Junior Creators',
      description: 'An analytical breakdown on automated video editing pipelines, structured non-destructive timelines, and the future of production operations.',
      status: 'editing',
      niche: 'AI & Engineering',
      targetPlatforms: ['youtube', 'instagram_reels', 'tiktok', 'linkedin', 'x'],
      tags: ['AI Operations', 'High Retention', 'Video Production'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const project2: ContentProjectRecord = {
      id: 'prj_02',
      userId: demoUserId,
      title: '7 Audio Tricks Every Creator Needs in 2026',
      description: 'Audio mastering workflow and voice leveling tips using modern compressor curves.',
      status: 'draft',
      niche: 'Media Production',
      targetPlatforms: ['youtube', 'tiktok'],
      tags: ['Audio', 'Sound Design'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.projects.set(project1.id, project1);
    this.projects.set(project2.id, project2);

    // 6. Scripts & Timestamped Transcripts
    const script1: ScriptRecord = {
      id: 'scr_01',
      projectId: project1.id,
      title: 'The AI Engineering Shift - Full Script',
      rawText: `[Hook - 00:00 to 00:04]
Artificial intelligence is fundamentally changing how creators produce video.
[Core Thesis - 00:04 to 00:08]
If you are still cutting podcasts and b-roll by hand, you are wasting 80% of your production time.
[Demonstration - 00:08 to 00:12]
With non-destructive timeline architectures, your cuts remain completely editable before hardware rendering.`,
      tone: 'conversational',
      wordCount: 52,
      durationSec: 12.3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.scripts.set(script1.id, script1);

    const transcript1: TranscriptRecord = {
      id: 'trn_01',
      assetId: asset1.id,
      fullText: 'Artificial intelligence is fundamentally changing how creators produce video. If you are still cutting podcasts and b-roll by hand, you are wasting 80% of your production time. With non-destructive timeline architectures, your cuts remain completely editable before hardware rendering.',
      language: 'en',
      confidence: 0.98,
      segments: [
        {
          id: 'seg_01',
          startTime: 0.0,
          endTime: 4.2,
          text: 'Artificial intelligence is fundamentally changing how creators produce video.',
          confidence: 0.99,
          words: [
            { word: 'Artificial', start: 0.0, end: 0.6 },
            { word: 'intelligence', start: 0.6, end: 1.2 },
            { word: 'is', start: 1.2, end: 1.4 },
            { word: 'fundamentally', start: 1.4, end: 2.1 },
            { word: 'changing', start: 2.1, end: 2.6 },
            { word: 'how', start: 2.6, end: 2.8 },
            { word: 'creators', start: 2.8, end: 3.4 },
            { word: 'produce', start: 3.4, end: 3.8 },
            { word: 'video', start: 3.8, end: 4.2 },
          ],
        },
        {
          id: 'seg_02',
          startTime: 4.2,
          endTime: 8.5,
          text: 'If you are still cutting podcasts and b-roll by hand, you are wasting 80% of your production time.',
          confidence: 0.97,
          words: [
            { word: 'If', start: 4.2, end: 4.4 },
            { word: 'you', start: 4.4, end: 4.6 },
            { word: 'are', start: 4.6, end: 4.8 },
            { word: 'still', start: 4.8, end: 5.1 },
            { word: 'cutting', start: 5.1, end: 5.5 },
            { word: 'podcasts', start: 5.5, end: 6.1 },
            { word: 'by', start: 6.1, end: 6.3 },
            { word: 'hand', start: 6.3, end: 6.8 },
          ],
        },
        {
          id: 'seg_03',
          startTime: 8.5,
          endTime: 12.3,
          text: 'With non-destructive timeline architectures, your cuts remain completely editable before hardware rendering.',
          confidence: 0.98,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.transcripts.set(transcript1.id, transcript1);

    // 7. Timeline (Structured Non-Destructive Edit Model)
    const timeline1: TimelineRecord = {
      id: 'tml_01',
      projectId: project1.id,
      aspectRatio: '16:9',
      totalDuration: 12.3,
      clips: [
        {
          id: 'tclip_01',
          sourceAssetId: asset1.id,
          sourceAssetName: asset1.name,
          sourceUrl: '/media/demo_main.mp4',
          startTime: 0.0,
          endTime: 8.5,
          timelineStart: 0.0,
          speed: 1.0,
          volume: 1.0,
          trackIndex: 0,
        },
        {
          id: 'tclip_02',
          sourceAssetId: asset2.id,
          sourceAssetName: asset2.name,
          sourceUrl: '/media/demo_broll.mp4',
          startTime: 0.0,
          endTime: 3.8,
          timelineStart: 8.5,
          speed: 1.0,
          volume: 0.8,
          trackIndex: 0,
        },
      ],
      captionTrack: [
        {
          id: 'cap_01',
          startTime: 0.0,
          endTime: 4.2,
          text: 'Artificial intelligence is changing video production.',
        },
        {
          id: 'cap_02',
          startTime: 4.2,
          endTime: 8.5,
          text: 'Stop manual scrubbing — keep edits non-destructive.',
        },
      ],
      overlays: [
        {
          id: 'ov_01',
          type: 'text',
          content: 'CREATORAI TIMELINE v2',
          startTime: 1.0,
          endTime: 5.0,
          x: 10,
          y: 10,
        },
      ],
      lastSavedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.timelines.set(timeline1.projectId, timeline1);

    // 9. Platform Connections
    const platforms = ['youtube', 'instagram_reels', 'tiktok', 'linkedin', 'x'];
    platforms.forEach((p) => {
      this.connections.set(`${demoUserId}_${p}`, {
        id: `conn_${p}`,
        userId: demoUserId,
        platform: p,
        accountHandle: undefined,
        accountName: undefined,
        avatarUrl: demoUser.avatarUrl,
        connected: false,
        followerCount: 0,
        connectedAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // 10. Publishing Schedules
    const schedule1: PublishingScheduleRecord = {
      id: 'sch_01',
      userId: demoUserId,
      projectId: project1.id,
      title: 'Episode 42 Premiere: AI Operations In Depth',
      description: 'DEMO DATA — illustrative scheduled record only; no external publication is configured.',
      platforms: ['youtube', 'linkedin'],
      scheduledTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'scheduled',
      thumbnailUrl: asset3.url,
      mediaUrl: '/media/demo_main.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.schedules.set(schedule1.id, schedule1);

    // 10. Clearly labelled sample analytics; not synced from platform APIs.
    const demoAnalytics: AnalyticsSnapshotRecord[] = [
      { id: 'an_01', userId: demoUserId, date: '2026-09-27', views: 38200, engagement: 4200, watchTimeHours: 1840, likes: 3100, comments: 420, shares: 680, retentionPercent: 68.4 },
      { id: 'an_02', userId: demoUserId, date: '2026-09-28', views: 42100, engagement: 4900, watchTimeHours: 2100, likes: 3450, comments: 510, shares: 740, retentionPercent: 71.2 },
      { id: 'an_03', userId: demoUserId, date: '2026-09-29', views: 51200, engagement: 5800, watchTimeHours: 2650, likes: 4200, comments: 630, shares: 970, retentionPercent: 73.8 },
      { id: 'an_04', userId: demoUserId, date: '2026-09-30', views: 64800, engagement: 7400, watchTimeHours: 3200, likes: 5300, comments: 840, shares: 1260, retentionPercent: 76.5 },
      { id: 'an_05', userId: demoUserId, date: '2026-10-01', views: 78500, engagement: 8900, watchTimeHours: 3950, likes: 6400, comments: 980, shares: 1520, retentionPercent: 78.1 },
      { id: 'an_06', userId: demoUserId, date: '2026-10-02', views: 92300, engagement: 10400, watchTimeHours: 4600, likes: 7600, comments: 1140, shares: 1820, retentionPercent: 81.3 },
      { id: 'an_07', userId: demoUserId, date: '2026-10-03', views: 104200, engagement: 11800, watchTimeHours: 5200, likes: 8700, comments: 1320, shares: 2150, retentionPercent: 82.9 },
    ];
    this.analytics.set(demoUserId, demoAnalytics);

    // 11. Seed Platform Adaptations
    const defaultAdaptations: PlatformAdaptationRecord[] = [
      {
        id: 'adp_yt',
        projectId: project1.id,
        platform: 'youtube',
        aspectRatio: '16:9',
        title: 'The AI Engineer Roadmap (2026 Edition) - Master Generative Tools & Agents',
        description: 'In this complete guide, we cover the exact tools, architectures, and pipelines needed to become a world-class AI engineer in 2026.\n\nChapters:\n0:00 Intro\n1:20 Core Fundamentals\n4:15 Model Deployment\n8:30 Production Best Practices',
        hashtags: ['#AIEngineering', '#MachineLearning', '#SoftwareDevelopment'],
        ctaText: 'Subscribe for weekly deep dives into production AI architectures.',
        captionStyle: 'minimal',
        maxDurationSeconds: 900,
        status: 'ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'adp_yts',
        projectId: project1.id,
        platform: 'youtube_shorts',
        aspectRatio: '9:16',
        title: '99% of creators are editing video backwards 🤯',
        description: 'Why you should stop manually scrubbing raw footage and link your script directly to the timeline.',
        hashtags: ['#Shorts', '#CreatorOps', '#TechTips'],
        ctaText: 'Subscribe for the full 10-minute guide.',
        captionStyle: 'karaoke_glow',
        maxDurationSeconds: 60,
        status: 'ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'adp_ig',
        projectId: project1.id,
        platform: 'instagram_reels',
        aspectRatio: '9:16',
        title: 'How we cut 12 hours of editing into 40 minutes ⚡️',
        description: 'The automated creator stack is finally here. Swipe to see how we sync transcripts with multi-camera footage automatically.',
        hashtags: ['#InstagramReels', '#VideoEditing', '#VideoCreator', '#TechSetup'],
        ctaText: 'Drop a 🔥 in the comments for the preset pack!',
        captionStyle: 'bold_punchy',
        maxDurationSeconds: 90,
        status: 'ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'adp_tt',
        projectId: project1.id,
        platform: 'tiktok',
        aspectRatio: '9:16',
        title: 'Stop spending 4 hours on subtitles #creatortips #videoedit',
        description: 'Auto-syncing captions with punchy kinetic highlights in 1-click.',
        hashtags: ['#creatortips', '#techtok', '#filmmaking', '#videoeditor'],
        ctaText: 'Follow for part 2.',
        captionStyle: 'bold_punchy',
        maxDurationSeconds: 60,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'adp_li',
        projectId: project1.id,
        platform: 'linkedin',
        aspectRatio: '1:1',
        title: 'The shift from single-creator chaos to programmatic content engineering',
        description: 'Most media teams are bloated with repetitive manual tasks. Here is an architectural blueprint showing how we reduced post-production latency by 72% using unified asset pipelines.\n\nKey takeaways:\n1. Keep edits fully non-destructive\n2. Script-first alignment prevents timeline fatigue\n3. Centralize raw assets with high-density metadata',
        hashtags: ['#CreatorEconomy', '#ArtificialIntelligence', '#EngineeringOps', '#Productivity'],
        ctaText: 'How is your team modernizing content workflows this year? Let me know below.',
        captionStyle: 'minimal',
        maxDurationSeconds: 120,
        status: 'ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'adp_x',
        projectId: project1.id,
        platform: 'x',
        aspectRatio: '16:9',
        title: 'The 2026 AI Creator Stack: A complete visual breakdown 🧵👇',
        description: '1/7 Most creators burn out because their post-production pipeline has 8 disconnected tools. Here is how to unify everything into a single operational interface.',
        hashtags: ['#BuildInPublic', '#AI', '#VideoTech'],
        ctaText: 'RT if you found this breakdown valuable!',
        captionStyle: 'subtitles_only',
        maxDurationSeconds: 140,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    defaultAdaptations.forEach((adp) => {
      this.adaptations.set(adp.platform, adp);
    });
  }
}

export const memoryStore = new MemoryStore();
export default memoryStore;

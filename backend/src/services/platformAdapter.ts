import { AppError } from '../middleware/errorHandler.js';

export type SupportedPlatform = 'youtube' | 'youtube_shorts' | 'instagram_reels' | 'instagram_post' | 'tiktok' | 'linkedin' | 'x';

export interface ExternalPublication {
  externalId: string;
  url: string;
}

export interface PlatformAdapter {
  readonly platform: SupportedPlatform;
  isConfigured(): boolean;
  connect(): Promise<{ authorizationUrl: string }>;
  disconnect(): Promise<void>;
  validate(): Promise<boolean>;
  upload(mediaUrl: string, metadata: Record<string, unknown>): Promise<{ externalId: string }>;
  schedule(mediaUrl: string, metadata: Record<string, unknown>, scheduledAt: Date): Promise<ExternalPublication>;
  publish(mediaUrl: string, metadata: Record<string, unknown>): Promise<ExternalPublication>;
  status(externalId: string): Promise<{ status: string; url?: string }>;
  analytics(externalId: string): Promise<Record<string, number>>;
}

class UnconfiguredPlatformAdapter implements PlatformAdapter {
  constructor(public readonly platform: SupportedPlatform) {}

  public isConfigured(): boolean {
    return false;
  }

  public async connect(): Promise<{ authorizationUrl: string }> {
    throw new AppError(`${this.platform} is not connected: OAuth credentials and callback configuration are not set up.`, 503, 'PLATFORM_NOT_CONFIGURED');
  }

  public async disconnect(): Promise<void> {}

  public async validate(): Promise<boolean> {
    return false;
  }

  public async upload(): Promise<{ externalId: string }> {
    throw new AppError(`${this.platform} upload is not available until its platform adapter is configured.`, 503, 'PLATFORM_NOT_CONFIGURED');
  }

  public async schedule(): Promise<ExternalPublication> {
    throw new AppError(`${this.platform} scheduling is not available until its platform adapter is configured.`, 503, 'PLATFORM_NOT_CONFIGURED');
  }

  public async publish(): Promise<ExternalPublication> {
    throw new AppError(`${this.platform} publishing is not available until its platform adapter is configured.`, 503, 'PLATFORM_NOT_CONFIGURED');
  }

  public async status(): Promise<{ status: string; url?: string }> {
    throw new AppError(`${this.platform} status lookup is not available until its platform adapter is configured.`, 503, 'PLATFORM_NOT_CONFIGURED');
  }

  public async analytics(): Promise<Record<string, number>> {
    throw new AppError(`${this.platform} analytics is not available until its platform adapter is configured.`, 503, 'PLATFORM_NOT_CONFIGURED');
  }
}

const platforms: SupportedPlatform[] = [
  'youtube',
  'youtube_shorts',
  'instagram_reels',
  'instagram_post',
  'tiktok',
  'linkedin',
  'x',
];

export const platformAdapters: ReadonlyMap<SupportedPlatform, PlatformAdapter> = new Map(
  platforms.map((platform) => [platform, new UnconfiguredPlatformAdapter(platform)])
);

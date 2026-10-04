import { memoryStore, PublishingScheduleRecord, PlatformConnectionRecord } from '../db/memoryStore.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler.js';
import { platformAdapters, SupportedPlatform } from './platformAdapter.js';

export interface SchedulePostInput {
  title: string;
  description?: string;
  platforms: string[];
  scheduledTime: string;
  projectId?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
}

export class PublishingService {
  public static async getConnections(userId: string): Promise<PlatformConnectionRecord[]> {
    return Array.from(memoryStore.connections.values())
      .filter((connection) => connection.userId === userId)
      .map((connection) => ({
        ...connection,
        connected: platformAdapters.get(connection.platform as SupportedPlatform)?.isConfigured() === true && connection.connected,
      }));
  }

  public static async toggleConnection(
    userId: string,
    platform: string,
    connect: boolean,
    accountHandle?: string
  ): Promise<PlatformConnectionRecord> {
    const adapter = platformAdapters.get(platform as SupportedPlatform);
    if (!adapter) throw new AppError('Unsupported publishing platform.', 400, 'UNSUPPORTED_PLATFORM');
    if (connect && !adapter.isConfigured()) {
      await adapter.connect();
    }
    const key = `${userId}_${platform}`;
    let record = memoryStore.connections.get(key);

    if (!record) {
      record = {
        id: `conn_${uuidv4().substring(0, 6)}`,
        userId,
        platform,
        accountHandle: undefined,
        accountName: undefined,
        connected: false,
        followerCount: 0,
        connectedAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      record.connected = connect;
      if (connect) {
        record.accountHandle = accountHandle || record.accountHandle;
        record.connectedAt = new Date().toISOString();
      } else {
        record.connectedAt = undefined;
      }
      record.updatedAt = new Date().toISOString();
    }

    memoryStore.connections.set(key, record);
    return record;
  }

  public static async getScheduledPosts(userId: string): Promise<PublishingScheduleRecord[]> {
    return Array.from(memoryStore.schedules.values()).filter((s) => s.userId === userId);
  }

  public static async schedulePost(userId: string, input: SchedulePostInput): Promise<PublishingScheduleRecord> {
    if (!input.title.trim() || input.title.length > 300 || input.platforms.length === 0 ||
        input.platforms.some((platform) => !platformAdapters.has(platform as SupportedPlatform))) {
      throw new AppError('A title and at least one supported platform are required.', 400, 'BAD_REQUEST');
    }
    const scheduledAt = new Date(input.scheduledTime);
    if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      throw new AppError('Scheduled publication time must be a valid future date.', 400, 'BAD_REQUEST');
    }
    if (input.projectId && memoryStore.projects.get(input.projectId)?.userId !== userId) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }
    if (input.mediaUrl && !Array.from(memoryStore.assets.values()).some((asset) =>
      asset.userId === userId && ['video', 'generated'].includes(asset.type) && asset.url === input.mediaUrl
    )) {
      throw new AppError('Scheduled media must be a video asset owned by this creator.', 404, 'ASSET_NOT_FOUND');
    }
    if (input.thumbnailUrl && !Array.from(memoryStore.assets.values()).some((asset) =>
      asset.userId === userId && (asset.url === input.thumbnailUrl || asset.thumbnailUrl === input.thumbnailUrl)
    )) {
      throw new AppError('Thumbnail must belong to an asset owned by this creator.', 404, 'ASSET_NOT_FOUND');
    }
    const schedule: PublishingScheduleRecord = {
      id: `sch_${uuidv4().substring(0, 8)}`,
      userId,
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      platforms: input.platforms,
      scheduledTime: input.scheduledTime,
      status: 'scheduled',
      thumbnailUrl: input.thumbnailUrl,
      mediaUrl: input.mediaUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryStore.schedules.set(schedule.id, schedule);
    return schedule;
  }

  public static async publishNow(
    userId: string,
    scheduleId: string
  ): Promise<{ success: boolean; schedule: PublishingScheduleRecord }> {
    const post = memoryStore.schedules.get(scheduleId);
    if (!post || post.userId !== userId) throw new AppError('Scheduled post not found', 404, 'NOT_FOUND');
    const adapters = post.platforms.map((platform) => platformAdapters.get(platform as SupportedPlatform));
    const unavailable = post.platforms.filter((_, index) => !adapters[index]?.isConfigured());
    if (unavailable.length > 0) {
      throw new AppError(
        `Not connected: no publishing adapter is configured for ${unavailable.join(', ')}. The post remains scheduled and has not been published.`,
        503,
        'PLATFORM_NOT_CONFIGURED'
      );
    }
    if (!post.mediaUrl) throw new AppError('A media file is required before publishing.', 400, 'MEDIA_REQUIRED');
    const media = Array.from(memoryStore.assets.values()).find((asset) =>
      asset.userId === userId && asset.url === post.mediaUrl && ['video', 'generated'].includes(asset.type)
    );
    if (!media) throw new AppError('The scheduled media asset is no longer available.', 404, 'ASSET_NOT_FOUND');

    const publishedUrls: Record<string, string> = {};
    const externalPublicationIds: Record<string, string> = {};
    for (let index = 0; index < post.platforms.length; index += 1) {
      const platform = post.platforms[index];
      const adapter = adapters[index];
      if (!adapter || !await adapter.validate()) {
        throw new AppError(`${platform} is not connected or its credentials are invalid. No publication was recorded.`, 503, 'PLATFORM_NOT_CONFIGURED');
      }
      try {
        const result = await adapter.publish(media.url, {
          title: post.title,
          description: post.description || '',
        });
        const publicationUrl = new URL(result.url);
        if (!result.externalId || publicationUrl.protocol !== 'https:') {
          throw new AppError(`${platform} returned an invalid external publication receipt.`, 502, 'INVALID_PUBLISH_RECEIPT');
        }
        publishedUrls[platform] = publicationUrl.toString();
        externalPublicationIds[platform] = result.externalId;
      } catch (error) {
        if (Object.keys(publishedUrls).length > 0) {
          post.status = 'failed';
          post.errorMessage = `Partial publication: ${Object.keys(publishedUrls).join(', ')} succeeded before another platform failed.`;
          post.publishedUrls = publishedUrls;
          post.externalPublicationIds = externalPublicationIds;
          post.updatedAt = new Date().toISOString();
          throw new AppError(post.errorMessage, 502, 'PARTIAL_PUBLISH_FAILURE');
        }
        throw error;
      }
    }
    post.status = 'published';
    post.publishedUrls = publishedUrls;
    post.externalPublicationIds = externalPublicationIds;
    post.errorMessage = undefined;
    post.updatedAt = new Date().toISOString();
    return { success: true, schedule: post };
  }
}
export default PublishingService;

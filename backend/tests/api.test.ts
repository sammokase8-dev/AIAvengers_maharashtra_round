import { afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import fs from 'fs/promises';
import path from 'path';
import { memoryStore } from '../src/db/memoryStore.js';

let renderedAssetId: string | undefined;

afterAll(async () => {
  if (!renderedAssetId) return;
  const asset = memoryStore.assets.get(renderedAssetId);
  if (asset) {
    for (const url of [asset.url, asset.thumbnailUrl]) {
      if (!url) continue;
      const file = path.resolve(process.cwd(), 'uploads', path.basename(url));
      try {
        await fs.unlink(file);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
    memoryStore.assets.delete(renderedAssetId);
  }
});

describe('CreatorAI Operations Platform API', () => {
  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/health returns the API health envelope', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { status: 'ok' },
    });
  });

  it('POST /api/auth/login succeeds with demo credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'alex@creatorai.studio',
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('alex@creatorai.studio');
  });

  it('GET /api/assets returns media asset items', async () => {
    const res = await request(app).get('/api/assets');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/assets/:id returns an individual asset', async () => {
    const res = await request(app).get('/api/assets/ast_vid_01');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('ast_vid_01');
  });

  it('does not allow a newly registered user to read the demo creator asset', async () => {
    const registration = await request(app).post('/api/auth/register').send({
      name: 'Ownership Test',
      email: `ownership-${Date.now()}@example.test`,
      password: 'StrongPassword123!',
    });
    expect(registration.status).toBe(201);
    const res = await request(app)
      .get('/api/assets/ast_vid_01')
      .set('Authorization', `Bearer ${registration.body.data.token}`);
    expect(res.status).toBe(404);
  });

  it('POST /api/ai/generate returns structured creator script', async () => {
    const res = await request(app).post('/api/ai/generate').send({
      operation: 'script',
      prompt: 'Why non-destructive video editing matters in 2026',
      tone: 'conversational',
      targetPlatform: 'youtube',
    });
    if (res.status === 503) {
      expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
      return;
    }
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.script).toBeDefined();
    expect(res.body.data.hook).toBeDefined();
  });

  it('GET /api/content/projects returns projects list', async () => {
    const res = await request(app).get('/api/content/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/video/timeline/prj_01 returns structured timeline', async () => {
    const res = await request(app).get('/api/video/timeline/prj_01');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.clips).toBeDefined();
    expect(res.body.data.aspectRatio).toBeDefined();
  });

  it('POST /api/clips/generate queues transcript-based candidate selection', async () => {
    const res = await request(app).post('/api/clips/generate').send({
      sourceAssetId: 'ast_vid_01',
      projectId: 'prj_01',
    });
    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('clip_generation');
    expect(res.body.data.id).toBe(res.body.jobId);
  });

  it('does not report a disconnected platform as connected or published', async () => {
    const connection = await request(app).post('/api/platforms/toggle').send({
      platform: 'youtube',
      connect: true,
    });
    expect(connection.status).toBe(503);
    expect(connection.body.error.code).toBe('PLATFORM_NOT_CONFIGURED');

    const publish = await request(app).post('/api/publishing/posts/sch_01/publish-now');
    expect(publish.status).toBe(503);
    expect(publish.body.error.code).toBe('PLATFORM_NOT_CONFIGURED');
  });

  it('renders a timeline with FFmpeg and registers the rendered file as an asset', async () => {
    const response = await request(app).post('/api/video/projects/prj_01/render').send({
      timeline: {
        projectId: 'prj_01',
        aspectRatio: '16:9',
        totalDuration: 1,
        clips: [{
          id: 'render-test-clip',
          sourceAssetId: 'ast_vid_01',
          sourceAssetName: 'Demo source video',
          sourceUrl: '/media/demo_main.mp4',
          startTime: 0,
          endTime: 1,
          timelineStart: 0,
          speed: 1,
          volume: 1,
          trackIndex: 0,
        }],
        captionTrack: [{ id: 'caption-test', startTime: 0, endTime: 0.9, text: 'Caption safely burned into the render.' }],
        overlays: [{
          id: 'overlay-test',
          type: 'text',
          content: "Safe text: don't execute anything",
          startTime: 0,
          endTime: 0.9,
          x: 10,
          y: 10,
          style: { fontSize: 20, color: '#ffffff' },
        }],
      },
      exportFormat: { resolution: '1080p' },
    });
    expect(response.status).toBe(202);
    const jobId = response.body.data.id as string;
    let job = response.body.data;
    for (let attempt = 0; attempt < 100 && job.status !== 'completed' && job.status !== 'failed'; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const current = await request(app).get(`/api/jobs/${jobId}`);
      job = current.body.data;
    }
    expect(job.status, job.error).toBe('completed');
    expect(job.resultUrl).toMatch(/^\/uploads\/render_.*\.mp4$/);
    const renderedAsset = Array.from(memoryStore.assets.values()).find((asset) => asset.url === job.resultUrl);
    expect(renderedAsset).toBeDefined();
    renderedAssetId = renderedAsset?.id;
  }, 20_000);

  it('GET /api/jobs/active returns the active job list', async () => {
    const res = await request(app).get('/api/jobs/active');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/search returns matches across entities', async () => {
    const res = await request(app).get('/api/search?q=AI');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

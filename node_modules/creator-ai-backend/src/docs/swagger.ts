import { config } from '../config/env.js';

const errorResponse = {
  description: 'Request failed. Error bodies use { success: false, error: { code, message } }.',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'BAD_REQUEST' },
              message: { type: 'string', example: 'Request values are invalid.' },
            },
          },
        },
      },
    },
  },
};

const jobSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', example: 'job_7c0293d8' },
    type: { type: 'string', example: 'rendering' },
    title: { type: 'string' },
    status: { type: 'string', enum: ['queued', 'processing', 'completed', 'failed'] },
    progress: { type: 'integer', minimum: 0, maximum: 100 },
    message: { type: 'string' },
    resultUrl: { type: 'string', example: '/uploads/render_<id>.mp4' },
  },
};

const jsonBody = (schema: object, example?: object) => ({
  required: true,
  content: {
    'application/json': {
      schema,
      ...(example ? { example } : {}),
    },
  },
});

const successResponse = (description: string, schema: object = { type: 'object' }, status = '200') => ({
  [status]: {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: schema,
          },
          required: ['success', 'data'],
        },
      },
    },
  },
});

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CreatorAI API',
    version: '1.0.0',
    description: [
      'REST API for the CreatorAI prototype. API errors use the documented error envelope.',
      'Send `Authorization: Bearer <JWT>` for authenticated requests. Authentication is required in production.',
      'AI generation and transcription require GEMINI_API_KEY unless explicitly labelled DEMO_MODE is enabled.',
      'Jobs are in-process and non-durable. Platform OAuth, external publishing, and analytics synchronization are not configured.',
      'Application domain data currently resides in process memory and is not persisted through Prisma.',
    ].join('\n\n'),
  },
  servers: [{ url: `http://localhost:${config.port}/api`, description: 'Local API' }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ErrorResponse: errorResponse.content['application/json'].schema,
      Job: jobSchema,
      TranscriptSegment: {
        type: 'object',
        required: ['startTime', 'endTime', 'text'],
        properties: {
          startTime: { type: 'number', minimum: 0, example: 42.2 },
          endTime: { type: 'number', example: 49.8 },
          text: { type: 'string', example: 'AI is changing software development.' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
      Timeline: {
        type: 'object',
        required: ['projectId', 'aspectRatio', 'totalDuration', 'clips', 'captionTrack', 'overlays'],
        properties: {
          projectId: { type: 'string', example: 'prj_01' },
          aspectRatio: { type: 'string', enum: ['16:9', '9:16', '1:1', '4:5'] },
          totalDuration: { type: 'number', minimum: 0 },
          clips: { type: 'array', items: { type: 'object' } },
          captionTrack: { type: 'array', items: { type: 'object' } },
          overlays: { type: 'array', items: { type: 'object' } },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Log in',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          required: ['email', 'password'],
          properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } },
        }, { email: 'alex@creatorai.studio', password: 'Password123!' }),
        responses: {
          ...successResponse('JWT and user profile returned.', { type: 'object', properties: { token: { type: 'string' }, user: { type: 'object' } } }),
          '401': errorResponse,
          '429': errorResponse,
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a creator account',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } },
        }),
        responses: { ...successResponse('Account created.', { type: 'object' }, '201'), '400': errorResponse, '409': errorResponse },
      },
    },
    '/assets': {
      get: {
        summary: 'List assets owned by the current creator',
        parameters: [
          { in: 'query', name: 'type', schema: { type: 'string' } },
          { in: 'query', name: 'folderId', schema: { type: 'string' } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
        ],
        responses: { ...successResponse('Asset list.', { type: 'array', items: { type: 'object' } }), '401': errorResponse },
      },
    },
    '/assets/upload': {
      post: {
        summary: 'Upload a media file (maximum 500 MB)',
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' }, folderId: { type: 'string' } } } } },
        },
        responses: { ...successResponse('Asset stored.', { type: 'object' }, '201'), '400': errorResponse, '413': errorResponse },
      },
    },
    '/ai/generate': {
      post: {
        summary: 'Generate structured AI content',
        requestBody: jsonBody({
          type: 'object',
          required: ['operation', 'prompt'],
          properties: {
            operation: { type: 'string', enum: ['idea', 'hook', 'script', 'caption', 'cta', 'plan', 'repurpose'] },
            prompt: { type: 'string', maxLength: 20000 },
            tone: { type: 'string' },
            targetPlatform: { type: 'string' },
          },
        }),
        responses: { ...successResponse('Structured content output.', { type: 'object' }), '400': errorResponse, '503': errorResponse },
      },
    },
    '/clips': {
      get: { summary: 'List owned transcript-based clip candidates', responses: { ...successResponse('Clip candidate list.', { type: 'array', items: { type: 'object' } }), '401': errorResponse } },
    },
    '/clips/generate': {
      post: {
        summary: 'Queue clip candidate selection from timestamped transcript segments',
        requestBody: jsonBody({
          type: 'object',
          required: ['sourceAssetId'],
          properties: { sourceAssetId: { type: 'string' }, projectId: { type: 'string' }, guidanceText: { type: 'string' }, targetCount: { type: 'integer', minimum: 1, maximum: 10 } },
        }),
        responses: { ...successResponse('Background job queued; poll /jobs/{id}.', jobSchema, '202'), '409': errorResponse, '422': errorResponse },
      },
    },
    '/video/transcript/{assetId}': {
      get: {
        summary: 'Get the stored transcript and timestamps for an owned asset',
        parameters: [{ in: 'path', name: 'assetId', required: true, schema: { type: 'string' } }],
        responses: { ...successResponse('Transcript or null when not yet generated.', { oneOf: [{ type: 'object' }, { type: 'null' }] }), '404': errorResponse },
      },
    },
    '/video/transcript/{assetId}/generate': {
      post: {
        summary: 'Queue audio extraction and Gemini transcription',
        parameters: [{ in: 'path', name: 'assetId', required: true, schema: { type: 'string' } }],
        responses: { ...successResponse('Transcription job queued.', jobSchema, '202'), '409': errorResponse, '503': errorResponse },
      },
    },
    '/video/projects/{projectId}/timeline': {
      get: {
        summary: 'Get a project timeline',
        parameters: [{ in: 'path', name: 'projectId', required: true, schema: { type: 'string' } }],
        responses: { ...successResponse('Non-destructive timeline.', { $ref: '#/components/schemas/Timeline' }), '404': errorResponse },
      },
      put: {
        summary: 'Save timeline instructions without modifying source files',
        parameters: [{ in: 'path', name: 'projectId', required: true, schema: { type: 'string' } }],
        requestBody: jsonBody({ $ref: '#/components/schemas/Timeline' }),
        responses: { ...successResponse('Timeline saved.', { $ref: '#/components/schemas/Timeline' }), '400': errorResponse, '404': errorResponse },
      },
    },
    '/video/projects/{projectId}/render': {
      post: {
        summary: 'Queue FFmpeg rendering; rendered output is a new asset',
        parameters: [{ in: 'path', name: 'projectId', required: true, schema: { type: 'string' } }],
        requestBody: jsonBody({
          type: 'object',
          required: ['timeline'],
          properties: {
            timeline: { $ref: '#/components/schemas/Timeline' },
            exportFormat: { type: 'object', properties: { resolution: { type: 'string', enum: ['1080p', '4k'] } } },
          },
        }),
        responses: { ...successResponse('Render job queued.', jobSchema, '202'), '400': errorResponse, '422': errorResponse },
      },
    },
    '/jobs/active': {
      get: { summary: 'List the creator’s queued and processing jobs', responses: { ...successResponse('Active job list.', { type: 'array', items: { $ref: '#/components/schemas/Job' } }), '401': errorResponse } },
    },
    '/jobs/{id}': {
      get: {
        summary: 'Get an owned background job',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { ...successResponse('Job state.', { $ref: '#/components/schemas/Job' }), '404': errorResponse },
      },
      delete: {
        summary: 'Dismiss an owned completed or failed job',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Job dismissed.' }, '404': errorResponse, '409': errorResponse },
      },
    },
    '/publishing/posts': {
      get: { summary: 'List internal schedule records; not external publication receipts', responses: { ...successResponse('Schedule list.', { type: 'array', items: { type: 'object' } }), '401': errorResponse } },
    },
    '/publishing/schedule': {
      post: {
        summary: 'Save an internal future schedule record; no automatic external dispatch is configured',
        requestBody: jsonBody({
          type: 'object',
          required: ['title', 'platforms', 'scheduledTime'],
          properties: { title: { type: 'string' }, description: { type: 'string' }, platforms: { type: 'array', items: { type: 'string' } }, scheduledTime: { type: 'string', format: 'date-time' }, projectId: { type: 'string' }, mediaUrl: { type: 'string' } },
        }),
        responses: { ...successResponse('Schedule record stored.', { type: 'object' }, '201'), '400': errorResponse },
      },
    },
    '/publishing/posts/{id}/publish-now': {
      post: {
        summary: 'Publish through a configured platform adapter; currently unavailable',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { ...successResponse('Published only when external receipts are verified.', { type: 'object' }), '503': errorResponse },
      },
    },
    '/analytics/dashboard': {
      get: {
        summary: 'Read stored analytics snapshots; demo values are labelled and not synced from platforms',
        parameters: [{ in: 'query', name: 'range', schema: { type: 'string', enum: ['7d', '30d', '90d', '1y'] } }],
        responses: { ...successResponse('Analytics data.', { type: 'object' }), '401': errorResponse },
      },
    },
    '/search': {
      get: {
        summary: 'Search owned assets, scripts, projects, clips, schedules, and transcript segments',
        parameters: [{ in: 'query', name: 'q', required: true, schema: { type: 'string', minLength: 2 } }],
        responses: { ...successResponse('Search results.', { type: 'array', items: { type: 'object' } }), '401': errorResponse },
      },
    },
  },
};

export default swaggerSpec;

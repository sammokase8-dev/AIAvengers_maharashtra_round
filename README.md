# CreatorAI: AI-Powered Creator Operations Platform

CreatorAI unifies the end-to-end modern media operation workflow into a single cohesive platform:
**IDEA &rarr; SCRIPT &rarr; RECORD &rarr; EDIT &rarr; REPURPOSE &rarr; PUBLISH &rarr; ANALYZE**

Built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Express 4**, **Prisma schema/client**, **FFmpeg/ffprobe**, **Google Gemini AI**, and **Socket.IO**. The current API domain store is in-memory; the Prisma schema is not yet used for application reads/writes.

---

## 1. Project Architecture

```
CREATORAI/
├── frontend/                     # React 19 + TypeScript + Vite
│   ├── public/
│   │   └── media/                # Demo videos (demo_main.mp4, demo_broll.mp4)
│   ├── src/
│   │   ├── api/                  # Fetch API client and endpoint services
│   │   ├── components/           # UI elements, VideoPlayer, modals, drawer
│   │   ├── context/              # Auth, Toast, RealtimeJobs contexts
│   │   ├── i18n/                 # 3-Language i18n system (en, hi, mr)
│   │   ├── layouts/              # AppLayout, PublicLayout, AuthLayout
│   │   ├── pages/                # Landing, Studio, Workspace, Editor, Clips, etc.
│   │   └── services/             # Frontend API consumption services
│   ├── .env.example
│   └── package.json
│
├── backend/                      #

│   ├── prisma/
│   │   └── schema.prisma         # 26 relational models with UUIDs, indexes, timestamps
│   ├── scripts/
│   │   └── seed.ts               # Optional PostgreSQL demo-account seeder
│   ├── src/
│   │   ├── config/               # Environment & runtime configuration
│   │   ├── db/                   # Prisma Client & intelligent in-memory store
│   │   ├── docs/                 # Swagger/OpenAPI documentation
│   │   ├── middleware/           # JWT Auth, Multer upload, error handling
│   │   ├── routes/                # REST API endpoints (Express 4 + TypeScript)
│   │   ├── services/             # Gemini AI, FFmpeg, Clips, Publish, Analytics
│   │   └── index.ts              # Server bootstrap, Socket.IO & static assets
│   ├── tests/                    # Vitest integration tests
│   ├── .env.example
│   └── package.json
│
├── package.json                  # Root orchestrator scripts
└── README.md                     # Complete platform documentation
```

---

## 2. Core Capabilities

1. **Asset Management**: Centralized media library supporting upload, technical metadata probing (resolution, codecs, bitrate, fps), folders, tags, favorites, and live HTML5 video previews.
2. **AI Studio**: Backend-powered Gemini generative studio for generating conversational hooks, full screenplays, social captions, CTAs, and multi-day content plans. Editable with transformations (improve, shorten, change tone, adapt platform).
3. **Script-to-Video Understanding**: Timestamped transcription followed by lexical overlap matching between script sentences and transcript segments; confidence is a heuristic, and creators can adjust/approve matches.
4. **Clip Candidate Selection**: Transcript-boundary candidates with a duration/transcript-fit heuristic. The score is not a view or virality prediction. Candidates are generated asynchronously and require review.
5. **Non-Destructive Video Editing**: Timeline records keep source trims, speed, volume, captions, and text overlays separate from original media. The current FFmpeg renderer supports the primary video track; unsupported tracks and overlays return errors.
6. **FFmpeg Video Pipeline**: Background rendering, aspect-ratio conversion, crop/scale/pad, audio handling, caption burn-in, and thumbnail extraction. Originals are not modified.
7. **Platform Adaptation**: Editable title/description/hashtag presets and rendered aspect-ratio variants. These are not platform uploads.
8. **Publishing Workspace**: CreatorAI can store and reschedule internal schedule records. External OAuth, automated scheduled dispatch, and publication are unavailable until adapters and a scheduler are configured; publish requests fail explicitly.
9. **Content Calendar**: Interactive calendar supporting Month, Week, and List queues across 7 pipeline stages.
10. **Analytics & Creator Intelligence**: Demo analytics are explicitly identified as seeded samples. Real platform analytics sync and evidence-backed recommendations require platform adapters and are not currently available.
11. **Localization**: English, Hindi (हिन्दी), and Marathi (मराठी); some newer workflow and error-state copy still needs translation.

---

## 3. Quick Start (Running Locally)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Optional for Prisma schema/seed tooling. The running API uses process-local memory and does not persist domain data to PostgreSQL.
- **Gemini API key**: Required for live AI generation and transcription. Without it, those operations return `503` unless explicit demo mode is enabled.

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
```

### Step 2: Environment Configuration
Copy the example environment files (PowerShell):
```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

### Step 3: Demo data and database
The in-memory demo creator and sample data are initialized by the backend automatically. `npm run seed` only creates the demo account in PostgreSQL when it is configured and reachable; that account is separate from the API's in-memory demo account. The running API does not use Prisma for application persistence.

To seed the separate Prisma database (optional):
```bash
npm run seed
```
*Local demo credentials:*
- **Email:** `alex@creatorai.studio`
- **Password:** `Password123!`

### Step 4: Start the Development Environment
From the repository root, run this single command to start the backend and frontend together:
```bash
npm run dev
```

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger Docs:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Legacy Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

The Vite development server proxies `/api`, `/health`, `/uploads`, `/media`, and Socket.IO traffic to the backend, so local frontend API calls use the centralized `VITE_API_BASE_URL=/api` setting without embedding a localhost URL in components. Press Ctrl+C once to stop both development servers. To build both workspaces, run `npm run build`. `npm start` runs the compiled backend and Vite's preview server after a build.

---

## 4. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend listening port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/creatorai?schema=public` |
| `JWT_SECRET` | Unique secret for signing auth tokens; required in production | `replace-with-a-unique-random-secret-of-at-least-32-characters` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `DEMO_MODE` | Enables explicitly labelled demo AI output; keep disabled for real accounts | `false` |
| `GEMINI_API_KEY` | Google Gemini API key for live AI generation and transcription | `your-gemini-api-key` |
| `SUPABASE_URL` | Supabase project URL (optional) | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase client key (optional) | `your-supabase-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase service role key (optional) | `your-supabase-service-role-key` |
| `STORAGE_BUCKET` | Cloud storage bucket name | `creatorai-media` |

### Frontend (`frontend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend REST API base URL | `http://localhost:5000/api` |
| `VITE_WS_URL` | Backend origin for Socket.IO job updates | `http://localhost:5000` |

---

## 5. Database Setup & Prisma Schema

The repository includes a Prisma schema with relational models for:
- `User`, `CreatorProfile`
- `Asset`, `AssetFolder`, `AssetTag`
- `ContentProject`, `ContentItem`
- `Script`, `ScriptVersion`, `Transcript`, `TranscriptSegment`
- `VideoAnalysis`, `Clip`
- `Timeline`, `TimelineSegment`, `CaptionTrack`
- `PlatformVariant`, `PlatformConnection`
- `PublishingSchedule`, `Publication`
- `AnalyticsSnapshot`, `AIJob`, `VideoProcessingJob`, `AIInsight`
- `Notification`, `AuditLog`

### Running Prisma schema setup (PostgreSQL)
When PostgreSQL is running:
```bash
cd backend
npx prisma generate
npx prisma db push
```

### Current persistence status
The API currently reads and writes to `backend/src/db/memoryStore.ts`, not Prisma. Database connectivity checks do not mean application data is persisted. Assets, projects, transcripts, timelines, jobs, schedules, and notifications are lost when the backend process restarts. Do not deploy this storage architecture for real user data.

---

## 6. Video Processing & FFmpeg Setup

CreatorAI uses an integrated FFmpeg architecture:
1. `@ffmpeg-installer/ffmpeg` and `@ffprobe-installer/ffprobe` bundle FFmpeg tools.
2. `fluent-ffmpeg` executes non-destructive video manipulation:
   - Probing audio & video streams (width, height, bitrate, duration, fps, codecs).
   - Timestamp-validated cuts, concatenation, playback speed, and volume.
   - Crop/scale/pad aspect-ratio conversion (16:9, 9:16, 1:1, 4:5).
   - High-resolution poster frame & thumbnail generation.
   - Burn-in subtitle rendering.

Source footage is strictly immutable: edits compile into new rendered media assets.

---

## 7. AI Studio & Google Gemini Integration

The AI engine runs entirely on the backend in `backend/src/services/geminiService.ts`:
- **Frontend Security**: `GEMINI_API_KEY` is NEVER exposed to the client.
- **Explicit demo mode**: With `DEMO_MODE=false` (default), missing Gemini credentials produce `503 AI_NOT_CONFIGURED`. Set `DEMO_MODE=true` only for a demo; demo output is labelled.
- **Supported Operations**:
  - `idea`: Structured content premise and hook suggestions.
  - `hook`: Opening-hook suggestions.
  - `script`: Structured script text.
  - `caption`: Social caption text and hashtags.
  - `cta`: Targeted comments and conversion calls.
  - `plan`: 7-day multi-channel sprint roadmaps.
  - `repurpose`: Long-form to bite-sized clip transformation.

---

## 8. Internationalization (i18n)

Supports three languages with full Devanagari script compatibility:
- **English** (`en`)
- **Hindi** (`hi` - हिन्दी)
- **Marathi** (`mr` - मराठी)

### Localization
The interface includes English, Hindi, and Marathi translations. Some newer workflow and error-state copy remains hard-coded and should be localized before release.

---

## 9. API Documentation

OpenAPI 3.0 documentation for the core API workflows is hosted at:
[http://localhost:5000/api/docs](http://localhost:5000/api/docs)

### Core Endpoints

| Resource | Route | Description |
| :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register` | Register new creator account |
| | `POST /api/auth/login` | Authenticate & retrieve JWT |
| | `GET /api/auth/me` | Fetch authenticated session profile |
| **Assets** | `GET /api/assets` | List media assets with filtering |
| | `POST /api/assets/upload` | Multipart file upload with technical probe |
| | `DELETE /api/assets/:id` | Remove asset |
| **AI Studio** | `POST /api/ai/generate` | Generate hook, script, caption, CTA, or plan |
| | `POST /api/ai/transform` | Shorten, improve, change tone, or adapt platform |
| **Clips** | `POST /api/clips/generate` | Queue transcript-based clip candidate selection (HTTP 202) |
| | `PATCH /api/clips/:id/status` | Mark clip as accepted or rejected |
| | `POST /api/clips/:id/regenerate-hook` | Re-synthesize virality hook |
| **Video** | `GET /api/video/timeline/:projectId` | Fetch structured non-destructive timeline |
| | `POST /api/video/timeline/:projectId` | Save timeline modifications |
| | `POST /api/video/projects/:projectId/render` | Queue FFmpeg render (HTTP 202); output is a new asset |
| | `POST /api/video/transcript/:assetId/generate` | Queue audio extraction and transcription (Gemini required) |
| **Publishing** | `GET /api/publishing/posts` | Read internal schedule records |
| | `POST /api/publishing/schedule` | Save an internal schedule record; does not publish externally |
| | `POST /api/publishing/posts/:id/publish-now` | Returns `503 PLATFORM_NOT_CONFIGURED` until a real adapter is configured |
| **Analytics** | `GET /api/analytics/dashboard` | Read stored snapshots; demo account values are labelled and not platform-synced |
| **Intelligence** | `GET /api/intelligence/insights` | Read stored insights; no recommendation is fabricated when evidence is absent |

---

## 10. External Integrations & Credentials

No OAuth adapters are implemented yet. Configuring provider credentials alone will not enable social connections, upload, scheduled dispatch, publication, status polling, or analytics sync. Until those adapters are implemented, platforms must remain **Not connected** and publish requests fail explicitly.

---

## 11. Testing & Validation

Run the backend integration test suite (including a short FFmpeg render with caption and text overlay burn-in):
```bash
cd backend
npm run test
```
Build both applications for production:
```bash
npm run build
```

---

## 12. Deployment Readiness

This is a local/competition prototype, not yet ready for production accounts or media. Before deployment, implement and verify:

- PostgreSQL-backed persistence for all API domain records and migrations used by the running app.
- Private object storage or authenticated/signed media delivery. The current local `/uploads` static route is not a production storage-permission model.
- A durable background queue/worker; current jobs are in-process and disappear on restart.
- OAuth adapters, token encryption/rotation, scheduled dispatch, verified publication receipts, and platform analytics sync.
- Production CORS origins, HTTPS termination, secrets management, deployment health checks, and storage retention/backup policy.
- A complete workflow test suite, accessibility audit, and localization coverage for newly added copy.

`SUPABASE_*` variables are placeholders only; the current API does not use them for storage. `REDIS_URL` is not configured or used.

## 13. License
Commercial Creator Operations Software &copy; 2026 CreatorAI Platform. All rights reserved.

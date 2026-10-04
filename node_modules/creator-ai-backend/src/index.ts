import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { checkDatabaseConnection } from './db/prisma.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { SocketService } from './services/socketService.js';
import { swaggerSpec } from './docs/swagger.js';
import { createRateLimit } from './middleware/rateLimit.js';

const app = express();
const server = http.createServer(app);

// 1. Security & Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow video/image cross-origin preview
  })
);

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));
app.use('/api/auth', createRateLimit(20, 60_000));
app.use('/api/ai', createRateLimit(15, 60_000));
app.use('/api/assets/upload', createRateLimit(10, 60_000));

// 2. Ensure Local Storage Directory exists & serve static
const uploadDir = path.resolve(config.localStorageDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Also serve public media if available
const publicMediaDir = path.resolve(process.cwd(), '../frontend/public/media');
if (fs.existsSync(publicMediaDir)) {
  app.use('/media', express.static(publicMediaDir));
}

// 3. API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 4. API Routes
app.use('/api', apiRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'CreatorAI Operations Backend',
  });
});

// 5. Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 6. Initialize Real-Time WebSockets
SocketService.init(server);

// 7. Start Server
const PORT = config.port;
if (config.nodeEnv !== 'test') {
  server.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(`🚀 CreatorAI Backend running on http://localhost:${PORT}`);
    console.log(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
    console.log(`📡 WebSocket server ready for real-time operations`);
    console.log(`=======================================================`);

    await checkDatabaseConnection();
  });
}

export default app;

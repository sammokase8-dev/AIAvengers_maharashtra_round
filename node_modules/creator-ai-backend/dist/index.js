"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_js_1 = require("./config/env.js");
const prisma_js_1 = require("./db/prisma.js");
const index_js_1 = require("./routes/index.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const socketService_js_1 = require("./services/socketService.js");
const swagger_js_1 = require("./docs/swagger.js");
const rateLimit_js_1 = require("./middleware/rateLimit.js");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// 1. Security & Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow video/image cross-origin preview
}));
app.use((0, cors_1.default)({
    origin: env_js_1.config.frontendUrl,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, morgan_1.default)('dev'));
app.use('/api/auth', (0, rateLimit_js_1.createRateLimit)(20, 60_000));
app.use('/api/ai', (0, rateLimit_js_1.createRateLimit)(15, 60_000));
app.use('/api/assets/upload', (0, rateLimit_js_1.createRateLimit)(10, 60_000));
// 2. Ensure Local Storage Directory exists & serve static
const uploadDir = path_1.default.resolve(env_js_1.config.localStorageDir);
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadDir));
// Also serve public media if available
const publicMediaDir = path_1.default.resolve(process.cwd(), '../frontend/public/media');
if (fs_1.default.existsSync(publicMediaDir)) {
    app.use('/media', express_1.default.static(publicMediaDir));
}
// 3. API Documentation
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_js_1.swaggerSpec));
// 4. API Routes
app.use('/api', index_js_1.apiRouter);
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
app.use(errorHandler_js_1.notFoundHandler);
app.use(errorHandler_js_1.errorHandler);
// 6. Initialize Real-Time WebSockets
socketService_js_1.SocketService.init(server);
// 7. Start Server
const PORT = env_js_1.config.port;
if (env_js_1.config.nodeEnv !== 'test') {
    server.listen(PORT, async () => {
        console.log(`=======================================================`);
        console.log(`🚀 CreatorAI Backend running on http://localhost:${PORT}`);
        console.log(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
        console.log(`📡 WebSocket server ready for real-time operations`);
        console.log(`=======================================================`);
        await (0, prisma_js_1.checkDatabaseConnection)();
    });
}
exports.default = app;

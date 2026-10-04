"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.isDbConnected = exports.checkDatabaseConnection = exports.getPrismaClient = void 0;
const client_1 = require("@prisma/client");
const env_js_1 = require("../config/env.js");
let prismaInstance = null;
let isPrismaConnected = false;
const getPrismaClient = () => {
    if (!prismaInstance) {
        prismaInstance = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: env_js_1.config.databaseUrl,
                },
            },
            log: env_js_1.config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
        });
    }
    return prismaInstance;
};
exports.getPrismaClient = getPrismaClient;
const checkDatabaseConnection = async () => {
    try {
        const client = (0, exports.getPrismaClient)();
        // Test connectivity
        await client.$connect();
        isPrismaConnected = true;
        console.log('[Database] Connected to PostgreSQL via Prisma successfully.');
        return true;
    }
    catch {
        isPrismaConnected = false;
        console.warn('[Database] PostgreSQL connection failed. Verify DATABASE_URL. Using in-memory storage fallback.');
        return false;
    }
};
exports.checkDatabaseConnection = checkDatabaseConnection;
const isDbConnected = () => isPrismaConnected;
exports.isDbConnected = isDbConnected;
exports.prisma = (0, exports.getPrismaClient)();
exports.default = exports.prisma;

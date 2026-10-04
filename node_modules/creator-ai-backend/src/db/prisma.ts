import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';

let prismaInstance: PrismaClient | null = null;
let isPrismaConnected = false;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: config.databaseUrl,
        },
      },
      log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaInstance;
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = getPrismaClient();
    // Test connectivity
    await client.$connect();
    isPrismaConnected = true;
    console.log('[Database] Connected to PostgreSQL via Prisma successfully.');
    return true;
  } catch {
    isPrismaConnected = false;
    console.warn('[Database] PostgreSQL connection failed. Verify DATABASE_URL. Using in-memory storage fallback.');
    return false;
  }
};

export const isDbConnected = (): boolean => isPrismaConnected;
export const prisma = getPrismaClient();
export default prisma;

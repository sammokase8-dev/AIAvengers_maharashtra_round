import dotenv from 'dotenv';
import path from 'path';
import { randomBytes } from 'crypto';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  demoMode: process.env.DEMO_MODE === 'true',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error('FATAL: JWT_SECRET environment variable must be set in production!');
      })()
    : randomBytes(32).toString('hex')),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/creatorai',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  localStorageDir: process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), 'uploads'),
  storageBucket: process.env.STORAGE_BUCKET || 'creatorai-media',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
};

export default config;

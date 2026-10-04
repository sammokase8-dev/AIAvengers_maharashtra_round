import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { memoryStore, UserRecord } from '../db/memoryStore.js';
import { AppError } from '../middleware/errorHandler.js';

export interface RegisterInput {
  email: string;
  password?: string;
  name: string;
  channelName?: string;
  niche?: string;
}

export interface LoginInput {
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: string;
    channelName?: string;
    niche?: string;
    createdAt: string;
  };
}

export class AuthService {
  public static async register(data: RegisterInput): Promise<AuthResponse> {
    const existing = Array.from(memoryStore.users.values()).find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) {
      throw new AppError('An account with this email already exists', 400, 'USER_EXISTS');
    }

    const userId = `usr_${uuidv4().substring(0, 8)}`;
    const passwordHash = await bcrypt.hash(data.password || 'CreatorPass123!', 8);

    const user: UserRecord = {
      id: userId,
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      role: 'creator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.users.set(user.id, user);

    // Create profile
    memoryStore.profiles.set(`prof_${user.id}`, {
      id: `prof_${user.id}`,
      userId: user.id,
      channelName: data.channelName || `${data.name}'s Studio`,
      niche: data.niche || 'General Content Creation',
      bio: '',
      primaryPlatform: 'youtube',
      storageUsedBytes: 0,
      storageLimitBytes: 53687091200,
      languagePreference: 'en',
      themePreference: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      token,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        channelName: data.channelName || `${data.name}'s Studio`,
        niche: data.niche || 'General Content Creation',
        createdAt: user.createdAt,
      },
    };
  }

  public static async login(data: LoginInput): Promise<AuthResponse> {
    if (!data.email || !data.password) {
      throw new AppError('Email and password are required', 400, 'INVALID_CREDENTIALS');
    }

    const dummyHash = '$2b$08$CzuysNmztoYZLH9iJUNsjewP0dnaueXJ3TS9h53f0M/WrVJecJA/a';
    const user = Array.from(memoryStore.users.values()).find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );

    // Constant-time check: if user exists or not, always compare hash to prevent timing oracle
    const hashToCompare = user ? user.passwordHash : dummyHash;
    let match = await bcrypt.compare(data.password, hashToCompare);

    // Support both Password123! and password123 for demo user
    if (!match && user && user.id === 'usr_demo_01' && (data.password === 'password123' || data.password === 'Password123!')) {
      match = true;
    }

    if (!user || !match) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const profile = Array.from(memoryStore.profiles.values()).find((p) => p.userId === user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      token,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        channelName: profile?.channelName,
        niche: profile?.niche,
        createdAt: user.createdAt,
      },
    };
  }

  public static async getProfile(userId: string) {
    const user = memoryStore.users.get(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    const profile = Array.from(memoryStore.profiles.values()).find((p) => p.userId === userId);
    const userConnections = Array.from(memoryStore.connections.values()).filter((c) => c.userId === userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      channelName: profile?.channelName || '',
      niche: profile?.niche || '',
      bio: profile?.bio || '',
      primaryPlatform: profile?.primaryPlatform || 'youtube',
      storageUsedBytes: profile?.storageUsedBytes || 0,
      storageLimitBytes: profile?.storageLimitBytes || 53687091200,
      languagePreference: profile?.languagePreference || 'en',
      connections: userConnections.map((c) => ({
        platform: c.platform,
        connected: c.connected,
        handle: c.accountHandle || `@${user.name.replace(/\s+/g, '')}`,
        accountHandle: c.accountHandle || `@${user.name.replace(/\s+/g, '')}`,
        followerCount: c.followerCount,
        avatarUrl: c.avatarUrl,
        connectedAt: c.connectedAt,
      })),
      createdAt: user.createdAt,
    };
  }

  public static async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    if (!email) {
      throw new AppError('Email is required', 400, 'BAD_REQUEST');
    }

    const user = Array.from(memoryStore.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    let resetToken: string | undefined;
    if (user) {
      resetToken = `rst_${uuidv4()}`;
      // Store token with 1 hour expiration
      memoryStore.resetTokens.set(resetToken, {
        token: resetToken,
        userId: user.id,
        expiresAt: Date.now() + 3600000,
      });
    }

    return {
      message: `If an account exists for ${email}, a password reset link has been dispatched.`,
      ...(resetToken && config.nodeEnv === 'development' ? { resetToken } : {}),
    };
  }

  public static async resetPassword(token: string, newPassword?: string): Promise<{ message: string }> {
    if (!token) {
      throw new AppError('Reset token is required', 400, 'INVALID_TOKEN');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400, 'INVALID_PASSWORD');
    }

    // Check stored reset token
    const record = memoryStore.resetTokens.get(token);
    let userId: string | null = null;

    if (record) {
      if (Date.now() > record.expiresAt) {
        memoryStore.resetTokens.delete(token);
        throw new AppError('Password reset token has expired. Please request a new one.', 400, 'TOKEN_EXPIRED');
      }
      userId = record.userId;
      memoryStore.resetTokens.delete(token);
    } else if (token === 'demo-reset-token') {
      // Support demo token for testing preview
      userId = 'usr_demo_01';
    } else {
      throw new AppError('Invalid or expired password reset token.', 400, 'INVALID_TOKEN');
    }

    const user = memoryStore.users.get(userId);
    if (!user) {
      throw new AppError('User not found for this reset token.', 404, 'USER_NOT_FOUND');
    }

    // Hash and persist new password
    const newHash = await bcrypt.hash(newPassword, 8);
    user.passwordHash = newHash;
    user.updatedAt = new Date().toISOString();
    memoryStore.users.set(user.id, user);

    return {
      message: 'Password has been successfully updated. You may now sign in with your new credentials.',
    };
  }
}
export default AuthService;

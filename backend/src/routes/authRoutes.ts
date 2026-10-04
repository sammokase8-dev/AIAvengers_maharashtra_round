import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const authRoutes = Router();

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  channelName: z.string().optional(),
  niche: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

authRoutes.post('/register', async (req: Request, res: Response, next) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(parseResult.error.errors[0].message, 400, 'VALIDATION_ERROR', parseResult.error.format());
    }
    const data = await AuthService.register(parseResult.data);
    res.status(201).json({ success: true, data, message: 'Account created successfully' });
  } catch (err) {
    next(err);
  }
});

authRoutes.post('/login', async (req: Request, res: Response, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(parseResult.error.errors[0].message, 400, 'VALIDATION_ERROR', parseResult.error.format());
    }
    const data = await AuthService.login(parseResult.data);
    res.json({ success: true, data, message: 'Signed in successfully' });
  } catch (err) {
    next(err);
  }
});

authRoutes.get('/me', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const data = await AuthService.getProfile(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

authRoutes.post('/forgot-password', async (req: Request, res: Response, next) => {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRoutes.post('/reset-password', async (req: Request, res: Response, next) => {
  try {
    const result = await AuthService.resetPassword(req.body.token, req.body.newPassword);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRoutes.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Signed out successfully' });
});

export default authRoutes;

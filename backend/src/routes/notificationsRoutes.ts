import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { memoryStore } from '../db/memoryStore.js';
import { AppError } from '../middleware/errorHandler.js';

export const notificationsRoutes = Router();

// GET /api/notifications
notificationsRoutes.get('/', optionalAuth, (req: Request, res: Response) => {
  const userId = req.user?.id || 'usr_demo_01';
  const notifications = Array.from(memoryStore.notifications.values()).filter((n) => n.userId === userId);
  res.json({ success: true, data: notifications });
});

// POST /api/notifications/:id/read
notificationsRoutes.post('/:id/read', optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id || 'usr_demo_01';
  const notif = memoryStore.notifications.get(req.params.id as string);
  if (!notif || notif.userId !== userId) return next(new AppError('Notification not found.', 404, 'NOT_FOUND'));
  notif.isRead = true;
  res.json({ success: true, message: 'Notification marked as read' });
});

// POST /api/notifications/read-all
notificationsRoutes.post('/read-all', optionalAuth, (req: Request, res: Response) => {
  const userId = req.user?.id || 'usr_demo_01';
  memoryStore.notifications.forEach((n) => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  res.json({ success: true, message: 'All notifications marked as read' });
});

export default notificationsRoutes;

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import creatorRoutes from './creatorRoutes.js';
import assetsRoutes from './assetsRoutes.js';
import aiRoutes from './aiRoutes.js';
import contentRoutes from './contentRoutes.js';
import videoRoutes from './videoRoutes.js';
import clipsRoutes from './clipsRoutes.js';
import platformsRoutes from './platformsRoutes.js';
import publishingRoutes from './publishingRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import intelligenceRoutes from './intelligenceRoutes.js';
import notificationsRoutes from './notificationsRoutes.js';
import jobsRoutes from './jobsRoutes.js';
import searchRoutes from './searchRoutes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/creator', creatorRoutes);
apiRouter.use('/assets', assetsRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/content', contentRoutes);
apiRouter.use('/video', videoRoutes);
apiRouter.use('/clips', clipsRoutes);
apiRouter.use('/platforms', platformsRoutes);
apiRouter.use('/publishing', publishingRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/intelligence', intelligenceRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/jobs', jobsRoutes);
apiRouter.use('/search', searchRoutes);

export default apiRouter;

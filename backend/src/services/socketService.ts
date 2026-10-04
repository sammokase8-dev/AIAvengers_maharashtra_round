import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config/env.js';

let ioInstance: SocketIOServer | null = null;

export class SocketService {
  public static init(server: HttpServer): SocketIOServer {
    ioInstance = new SocketIOServer(server, {
      cors: {
        origin: config.frontendUrl,
        methods: ['GET', 'POST'],
      },
    });

    ioInstance.on('connection', (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      socket.on('join_user', (userId: string) => {
        socket.join(`user_${userId}`);
      });

      socket.on('disconnect', () => {
        // client disconnected
      });
    });

    return ioInstance;
  }

  public static broadcastJobUpdate(job: any): void {
    if (ioInstance) {
      if (job.userId) {
        ioInstance.to(`user_${job.userId}`).emit('job:update', job);
      } else {
        ioInstance.emit('job:update', job);
      }
    }
  }

  public static sendNotification(userId: string, notification: any): void {
    if (ioInstance) {
      ioInstance.to(`user_${userId}`).emit('notification:new', notification);
    }
  }
}
export default SocketService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const env_js_1 = require("../config/env.js");
let ioInstance = null;
class SocketService {
    static init(server) {
        ioInstance = new socket_io_1.Server(server, {
            cors: {
                origin: env_js_1.config.frontendUrl,
                methods: ['GET', 'POST'],
            },
        });
        ioInstance.on('connection', (socket) => {
            console.log(`[Socket.IO] Client connected: ${socket.id}`);
            socket.on('join_user', (userId) => {
                socket.join(`user_${userId}`);
            });
            socket.on('disconnect', () => {
                // client disconnected
            });
        });
        return ioInstance;
    }
    static broadcastJobUpdate(job) {
        if (ioInstance) {
            if (job.userId) {
                ioInstance.to(`user_${job.userId}`).emit('job:update', job);
            }
            else {
                ioInstance.emit('job:update', job);
            }
        }
    }
    static sendNotification(userId, notification) {
        if (ioInstance) {
            ioInstance.to(`user_${userId}`).emit('notification:new', notification);
        }
    }
}
exports.SocketService = SocketService;
exports.default = SocketService;

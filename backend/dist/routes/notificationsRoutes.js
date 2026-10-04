"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRoutes = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const memoryStore_js_1 = require("../db/memoryStore.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
exports.notificationsRoutes = (0, express_1.Router)();
// GET /api/notifications
exports.notificationsRoutes.get('/', auth_js_1.optionalAuth, (req, res) => {
    const userId = req.user?.id || 'usr_demo_01';
    const notifications = Array.from(memoryStore_js_1.memoryStore.notifications.values()).filter((n) => n.userId === userId);
    res.json({ success: true, data: notifications });
});
// POST /api/notifications/:id/read
exports.notificationsRoutes.post('/:id/read', auth_js_1.optionalAuth, (req, res, next) => {
    const userId = req.user?.id || 'usr_demo_01';
    const notif = memoryStore_js_1.memoryStore.notifications.get(req.params.id);
    if (!notif || notif.userId !== userId)
        return next(new errorHandler_js_1.AppError('Notification not found.', 404, 'NOT_FOUND'));
    notif.isRead = true;
    res.json({ success: true, message: 'Notification marked as read' });
});
// POST /api/notifications/read-all
exports.notificationsRoutes.post('/read-all', auth_js_1.optionalAuth, (req, res) => {
    const userId = req.user?.id || 'usr_demo_01';
    memoryStore_js_1.memoryStore.notifications.forEach((n) => {
        if (n.userId === userId) {
            n.isRead = true;
        }
    });
    res.json({ success: true, message: 'All notifications marked as read' });
});
exports.default = exports.notificationsRoutes;

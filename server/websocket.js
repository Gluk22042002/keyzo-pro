import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { get, run } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'keyzo-pro-secret';

export function initWebSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const onlineUsers = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`[WS] User connected: ${userId}`);

    onlineUsers.set(userId, socket.id);
    await run('UPDATE users SET last_active = NOW() WHERE id = $1', [userId]);
    io.emit('user_online', { userId, online: true });

    socket.join(`user:${userId}`);

    socket.on('join', (data) => {
      const roomId = data?.roomId || data;
      if (roomId) {
        socket.join(roomId);
        console.log(`[WS] ${userId} joined room: ${roomId}`);
      }
    });

    socket.on('leave', (data) => {
      const roomId = data?.roomId || data;
      if (roomId) {
        socket.leave(roomId);
        console.log(`[WS] ${userId} left room: ${roomId}`);
      }
    });

    socket.on('message', async (data) => {
      try {
        const { receiver_id, text } = data;
        if (!receiver_id || !text?.trim()) {
          return socket.emit('error', { message: 'Missing receiver_id or text' });
        }

        await run('INSERT INTO messages (sender_id, receiver_id, text) VALUES ($1, $2, $3)', [userId, receiver_id, text.trim()]);

        const msg = await get('SELECT * FROM messages ORDER BY id DESC LIMIT 1');

        socket.emit('message_sent', msg);
        io.to(`user:${receiver_id}`).emit('message_received', msg);

        io.to(`user:${receiver_id}`).emit('notification', {
          type: 'message',
          title: 'Новое сообщение',
          message: text.trim().slice(0, 100),
        });
      } catch (e) {
        console.error('[WS] Message error:', e.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (data) => {
      const { receiver_id } = data;
      if (receiver_id) {
        io.to(`user:${receiver_id}`).emit('typing', { userId, typing: true });
      }
    });

    socket.on('stop_typing', (data) => {
      const { receiver_id } = data;
      if (receiver_id) {
        io.to(`user:${receiver_id}`).emit('typing', { userId, typing: false });
      }
    });

    socket.on('mark_read', async (data) => {
      const { sender_id } = data;
      if (sender_id) {
        await run('UPDATE messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false', [sender_id, userId]);
        io.to(`user:${sender_id}`).emit('messages_read', { readerId: userId });
      }
    });

    socket.on('get_online', (data) => {
      const { userIds } = data;
      if (Array.isArray(userIds)) {
        const statuses = userIds.map((id) => ({ userId: id, online: onlineUsers.has(id) }));
        socket.emit('online_status', statuses);
      }
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      io.emit('user_online', { userId, online: false });
      await run('UPDATE users SET last_active = NOW() WHERE id = $1', [userId]);
      console.log(`[WS] User disconnected: ${userId}`);
    });
  });

  io.getOnlineUsers = () => Array.from(onlineUsers.keys());

  return io;
}

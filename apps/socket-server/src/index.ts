import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { logger } from './lib/logger';
import { socketAuthMiddleware } from './middleware/auth';
import { registerRoomHandlers, handleLeaveRoom } from './handlers/room';
import { registerCollaborationHandlers } from './handlers/collaboration';
import { registerAwarenessHandlers } from './handlers/awareness';
import { roomManager } from './rooms/room-manager';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Express app for health checks
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));

app.get('/', (_req, res) => {
  res.json({
    name: 'Collabdoc Collaboration Server',
    status: 'healthy',
    websocket: 'enabled',
    uptime: process.uptime(),
    healthCheck: '/health',
  });
});

app.get('/health', (_req, res) => {
  const stats = roomManager.getStats();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    rooms: stats.activeRooms,
    connections: stats.totalConnections,
    details: stats.rooms,
  });
});

// HTTP + Socket.io server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e6, // 1 MB max message size
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.use(socketAuthMiddleware);

// Give room manager a reference to io for save-status broadcasts
roomManager.setIO(io);

app.post('/internal/rooms/:id/force-reload', (req, res) => {
  const documentId = req.params.id;
  io.to(documentId).emit('force-reload');
  roomManager.evictRoom(documentId);
  res.json({ success: true });
});

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected');

  // Register all handler groups
  registerRoomHandlers(io, socket);
  registerCollaborationHandlers(io, socket);
  registerAwarenessHandlers(io, socket);

  // ─── DISCONNECT HANDLER ───
  socket.on('disconnect', (reason) => {
    logger.info({ socketId: socket.id, reason }, 'Client disconnected');

    // Clean up all rooms this socket was in
    type SocketWithMetadata = typeof socket & { __rooms?: Set<string> };
    const metaSocket = socket as SocketWithMetadata;
    const rooms = metaSocket.__rooms;
    if (rooms) {
      for (const documentId of rooms) {
        handleLeaveRoom(io, socket, documentId);
      }
    }
  });
});

// ─── GRACEFUL SHUTDOWN ───
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal, saving all rooms...');
  await roomManager.shutdownAll();
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced exit after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info({ port: PORT, cors: CORS_ORIGIN }, '🚀 Socket.io server running');
  });
}

export { io, httpServer };

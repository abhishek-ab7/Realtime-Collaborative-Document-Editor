import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pino from 'pino';
import { socketAuthMiddleware } from './middleware/auth';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Express app for health checks
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
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

// TODO: Phase 4 — Add room handlers
// TODO: Phase 4 — Add collaboration handlers
// TODO: Phase 5 — Add awareness handlers

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected');

  socket.on('disconnect', (reason) => {
    logger.info({ socketId: socket.id, reason }, 'Client disconnected');
  });
});

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info({ port: PORT, cors: CORS_ORIGIN }, '🚀 Socket.io server running');
  });
}

export { io, httpServer };

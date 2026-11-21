import http from 'http';
import app from './app';
import { env } from './config/env';
import { initializeSockets } from './sockets';
import { prisma } from './prisma/client';

const server = http.createServer(app);

// Initialize Socket.IO server on path /socket.io
initializeSockets(server);

const PORT = env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 SuvidhaaQ API Server listening on port ${PORT} [${env.NODE_ENV}]`);
  console.log(`📡 Base API Path: http://localhost:${PORT}/api/v1`);
  console.log(`⚡ Socket.IO listening on http://localhost:${PORT}/socket.io`);
});

// Graceful shutdown hooks
const handleShutdown = async (signal: string) => {
  console.log(`\n📶 Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    console.log('🛑 HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('📦 Database connection closed.');
    } catch (err) {
      console.error('❌ Error closing database:', err);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️ Forcefully terminating process due to shutdown timeout.');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export { server };

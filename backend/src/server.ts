import http from 'http';
import app from './app';
import { env } from './config/env';
import { initializeFirebase } from './config/firebase';
import { prisma } from './prisma/client';

const server = http.createServer(app);

// Initialize Firebase Admin credentials
initializeFirebase();

const PORT = env.PORT;

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Handle graceful shutdown hooks
const handleShutdown = async (signal: string) => {
  console.log(`\n📶 Received ${signal}. Initiating graceful shutdown...`);
  
  server.close(async () => {
    console.log('🛑 HTTP server closed.');
    
    try {
      await prisma.$disconnect();
      console.log('📦 Prisma database connection closed.');
    } catch (dbError) {
      console.error('❌ Error during database disconnect:', dbError);
    }
    
    process.exit(0);
  });
  
  // Timeout for shutdown sequence
  setTimeout(() => {
    console.error('⚠️ Forcefully terminating process due to shutdown timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

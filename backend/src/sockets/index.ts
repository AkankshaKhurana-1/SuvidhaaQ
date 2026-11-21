import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

let ioInstance: Server | null = null;

export const initializeSockets = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow all frontend origins
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Handshake authentication middleware
  io.use((socket: Socket, next) => {
    try {
      const authHeader =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (authHeader) {
        const tokenString = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : authHeader;
        const decoded = jwt.verify(tokenString, env.JWT_SECRET) as any;
        socket.data.user = {
          id: decoded.sub,
          role: decoded.role,
          hospitalId: decoded.hospitalId,
          name: decoded.name,
        };
      }
      // Allow connection even without token (for public queue display boards if needed)
      next();
    } catch (err) {
      console.warn(`[Socket.IO] Auth verification warning: ${(err as any).message}`);
      // Don't kill connection, allow guest with no socket.data.user
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    if (user) {
      // Auto-join personal room
      socket.join(`user:${user.id}`);
      if (user.hospitalId) {
        socket.join(`hospital:${user.hospitalId}`);
      }
    }

    // Join doctor queue room: hospital:{hospitalId}:doctor:{doctorId}
    socket.on('join:doctor', (data: { hospitalId: string; doctorId: string } | string) => {
      let hospitalId = user?.hospitalId;
      let doctorId = '';

      if (typeof data === 'string') {
        doctorId = data;
      } else if (data && typeof data === 'object') {
        hospitalId = data.hospitalId || hospitalId;
        doctorId = data.doctorId;
      }

      if (hospitalId && doctorId) {
        const room = `hospital:${hospitalId}:doctor:${doctorId}`;
        socket.join(room);
        socket.emit('joined', { room, success: true });
      } else if (doctorId) {
        // Fallback room
        socket.join(`doctor:${doctorId}`);
        socket.emit('joined', { room: `doctor:${doctorId}`, success: true });
      }
    });

    socket.on('leave:doctor', (data: { hospitalId?: string; doctorId: string } | string) => {
      const doctorId = typeof data === 'string' ? data : data?.doctorId;
      const hospitalId = typeof data === 'object' ? data?.hospitalId || user?.hospitalId : user?.hospitalId;
      if (hospitalId && doctorId) {
        socket.leave(`hospital:${hospitalId}:doctor:${doctorId}`);
      }
      if (doctorId) {
        socket.leave(`doctor:${doctorId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  ioInstance = io;
  console.log('⚡ Socket.IO initialized successfully');
  return io;
};

export const getIO = (): Server | null => {
  return ioInstance;
};

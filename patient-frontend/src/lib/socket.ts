import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token: token ? `Bearer ${token}` : '' },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to SuvidhaaQ Realtime Engine');
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${reason}`);
    });
  }

  return socket;
};

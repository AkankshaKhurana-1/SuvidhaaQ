import { io, Socket } from 'socket.io-client';

export const getSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.port !== '3000' && window.location.port !== '3001') {
      return window.location.origin;
    }
  }
  return 'http://localhost:5001';
};

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const socketUrl = getSocketUrl();

    socket = io(socketUrl, {
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

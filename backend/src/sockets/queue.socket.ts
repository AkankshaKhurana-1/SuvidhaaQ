import { Server, Socket } from 'socket.io';
import { SocketEvents } from './events';

export const registerQueueHandlers = (io: Server, socket: Socket): void => {
  // Join a doctor-specific queue room
  socket.on(SocketEvents.JOIN_QUEUE, (doctorId: string) => {
    const room = `queue_doctor_${doctorId}`;
    socket.join(room);
    console.log(`[Socket] Client ${socket.id} joined ${room}`);
    socket.emit('joined_room', { room, success: true });
  });

  // Leave a doctor-specific queue room
  socket.on(SocketEvents.LEAVE_QUEUE, (doctorId: string) => {
    const room = `queue_doctor_${doctorId}`;
    socket.leave(room);
    console.log(`[Socket] Client ${socket.id} left ${room}`);
  });
};

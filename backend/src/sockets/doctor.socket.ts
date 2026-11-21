import { Server, Socket } from 'socket.io';
import { SocketEvents } from './events';

export const registerDoctorHandlers = (io: Server, socket: Socket): void => {
  // Listen for doctor availability updates from connected doctor client
  socket.on(SocketEvents.DOCTOR_STATUS_CHANGED, (data: { doctor_id: string; status: string }) => {
    console.log(`[Socket] Doctor ${data.doctor_id} status changed to ${data.status}`);
    // Broadcast to all clients in doctor's queue room
    io.to(`queue_doctor_${data.doctor_id}`).emit(SocketEvents.DOCTOR_STATUS_CHANGED, data);
  });
};

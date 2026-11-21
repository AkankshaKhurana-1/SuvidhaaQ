export const SocketEvents = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // Queue events
  JOIN_QUEUE: 'join_queue',
  LEAVE_QUEUE: 'leave_queue',
  QUEUE_UPDATED: 'queue_updated',
  PATIENT_CALLED: 'patient_called',
  TOKEN_GENERATED: 'token_generated',

  // Doctor events
  DOCTOR_STATUS_CHANGED: 'doctor_status_changed',
  DOCTOR_AVAILABILITY: 'doctor_availability',

  // Emergency events
  EMERGENCY_ALERT: 'emergency_alert',
} as const;

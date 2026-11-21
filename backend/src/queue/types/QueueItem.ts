import { TokenStatus } from './TokenStatus';

export interface QueueItem {
  token_id: string;
  token_code: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  hospital_id: string;
  appointment_id?: string;
  token_type: 'Appointment' | 'Walk-in';
  queue_position: number;
  priority_score: number;
  token_status: TokenStatus;
  check_in_time: Date;
  estimated_wait_time: number; // in minutes
}

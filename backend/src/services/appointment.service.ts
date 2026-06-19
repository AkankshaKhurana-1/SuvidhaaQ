import { prisma } from '../prisma/client';

export interface BookAppointmentInput {
  patient_id: string;
  doctor_id: string;
  date: string;
  time: string;
  type: 'new' | 'followup';
  notes?: string;
}

export interface BookAppointmentOutput {
  success: boolean;
  appointment_id: string;
  token_number: number;
  date: string;
  time: string;
}

export interface PatientAppointmentOutput {
  appointment_id: string;
  date: string;
  time: string;
  doctor: string;
  type: 'new' | 'followup';
  status: string;
}

export interface AllAppointmentsOutput {
  appointment_id: string;
  patient_name: string;
  date: string;
  time: string;
  doctor: string;
  status: string;
}

export class AppointmentService {
  /**
   * Books a new appointment between a patient and a doctor.
   */
  public async bookAppointment(data: BookAppointmentInput): Promise<BookAppointmentOutput> {
    console.log(`[AppointmentService] Processing booking request for doctor ${data.doctor_id} and patient ${data.patient_id} in database`);

    const doctorIdBig = BigInt(data.doctor_id);
    const patientIdBig = BigInt(data.patient_id);

    // Verify doctor exists
    const doctorExists = await prisma.doctors.findUnique({
      where: { doctor_id: doctorIdBig },
    });
    if (!doctorExists) {
      throw new Error(`Doctor ${data.doctor_id} not found`);
    }

    // Verify patient exists
    const patientExists = await prisma.patients.findUnique({
      where: { patient_id: patientIdBig },
    });
    if (!patientExists) {
      throw new Error(`Patient ${data.patient_id} not found`);
    }

    // Parse date & time to DateTime format
    const appointmentDateTime = new Date(`${data.date}T${data.time}:00`);
    const apptType = data.type === 'followup' ? 'Follow-up' : 'General';

    // Insert Appointment record into database using Prisma
    const appointment = await prisma.appointments.create({
      data: {
        patient_id: patientIdBig,
        doctor_id: doctorIdBig,
        hospital_id: doctorExists.hospital_id,
        appointment_date: appointmentDateTime,
        appointment_type: apptType,
        appointment_status: 'Upcoming',
      },
    });

    return {
      success: true,
      appointment_id: appointment.appointment_id.toString(),
      token_number: 0, // Placeholder queue number - to be updated/recalculated by the queue engine
      date: data.date,
      time: data.time,
    };
  }

  /**
   * Fetches all appointments registered in the system.
   */
  public async getAllAppointments(): Promise<AllAppointmentsOutput[]> {
    console.log('[AppointmentService] Fetching all appointments from database');

    const appointments = await prisma.appointments.findMany({
      include: {
        doctors: {
          include: {
            users: true,
          },
        },
        patients: true,
      },
    });

    return appointments.map((appt) => {
      const doctorName = appt.doctors.users?.full_name || `Dr. ${appt.doctor_id}`;
      return {
        appointment_id: appt.appointment_id.toString(),
        patient_name: appt.patients.full_name,
        date: appt.appointment_date.toISOString().split('T')[0],
        time: appt.appointment_date.toISOString().split('T')[1].substring(0, 5),
        doctor: doctorName,
        status: appt.appointment_status,
      };
    });
  }

  /**
   * Fetches appointments registered for a specific patient.
   */
  public async getAppointmentsByPatient(patientId: string): Promise<PatientAppointmentOutput[]> {
    console.log(`[AppointmentService] Fetching appointments for patient ${patientId} from database`);

    const appointments = await prisma.appointments.findMany({
      where: { patient_id: BigInt(patientId) },
      include: {
        doctors: {
          include: {
            users: true,
          },
        },
      },
    });

    return appointments.map((appt) => {
      const doctorName = appt.doctors.users?.full_name || `Dr. ${appt.doctor_id}`;
      const apptType = appt.appointment_type === 'Follow-up' ? 'followup' : 'new';
      return {
        appointment_id: appt.appointment_id.toString(),
        date: appt.appointment_date.toISOString().split('T')[0],
        time: appt.appointment_date.toISOString().split('T')[1].substring(0, 5),
        doctor: doctorName,
        type: apptType as 'new' | 'followup',
        status: appt.appointment_status,
      };
    });
  }
}

import { prisma } from '../prisma/client';

export interface DoctorProfileDto {
  doctor_id: string;
  name: string;
  specialization: string;
  status: string;
  avg_time_new: number;
  avg_time_followup: number;
  patients_seen_today: number;
}

export class DoctorService {
  /**
   * Fetches specific doctor's profile.
   * 
   * Calculates patients_seen_today and average consultation durations using consultations table only.
   */
  public async getDoctorProfile(doctorId: string): Promise<DoctorProfileDto> {
    console.log(`[DoctorService] Fetching profile for doctor from database: ${doctorId}`);

    const doctorIdBig = BigInt(doctorId);

    const doctor = await prisma.doctors.findUnique({
      where: { doctor_id: doctorIdBig },
      include: {
        users: true,
      },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate patients seen today using consultations table
    const patientsSeenToday = await prisma.consultations.count({
      where: {
        doctor_id: doctorIdBig,
        start_time: { gte: today },
      },
    });

    // Calculate average durations using consultations table joining queue_tokens/appointments
    const avgNewAggregate = await prisma.consultations.aggregate({
      where: {
        doctor_id: doctorIdBig,
        queue_tokens: {
          OR: [
            { token_type: 'Walk-in' },
            {
              appointments: {
                appointment_type: 'General',
              },
            },
          ],
        },
      },
      _avg: {
        duration: true,
      },
    });

    const avgFollowupAggregate = await prisma.consultations.aggregate({
      where: {
        doctor_id: doctorIdBig,
        queue_tokens: {
          appointments: {
            appointment_type: 'Follow-up',
          },
        },
      },
      _avg: {
        duration: true,
      },
    });

    const avgTimeNew = avgNewAggregate._avg.duration ? Number(avgNewAggregate._avg.duration.toFixed(1)) : 15;
    const avgTimeFollowup = avgFollowupAggregate._avg.duration ? Number(avgFollowupAggregate._avg.duration.toFixed(1)) : 10;

    const doctorName = doctor.users?.full_name || `Dr. ${doctor.doctor_id}`;

    return {
      doctor_id: doctor.doctor_id.toString(),
      name: doctorName,
      specialization: doctor.specialization,
      status: doctor.availability_status,
      avg_time_new: avgTimeNew,
      avg_time_followup: avgTimeFollowup,
      patients_seen_today: patientsSeenToday,
    };
  }

  /**
   * Updates availability state and reason of a doctor.
   */
  public async updateDoctorStatus(
    doctorId: string, 
    status: string,
    reason?: string
  ): Promise<{ success: boolean; status: string }> {
    console.log(`[DoctorService] Updating doctor ${doctorId} status to ${status} in database. Reason: ${reason || 'None'}`);

    const dbStatus = status === 'unavailable' ? 'on_leave' : status;

    await prisma.doctors.update({
      where: { doctor_id: BigInt(doctorId) },
      data: {
        availability_status: dbStatus,
      },
    });

    return {
      success: true,
      status: status,
    };
  }
}

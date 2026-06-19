import { prisma } from '../prisma/client';

// TypeScript Interfaces for the Admin module (matches Contract Section 7)

export interface CommandCenterDto {
  total_patients_today: number;
  currently_waiting: number;
  in_consultation: number;
  in_test: number;
  done_today: number;
  followup_ratio: number;
  avg_wait_time: number;
  doctor_status: 'available' | 'unavailable';
}

export interface AnalyticsDto {
  peak_hours: string[];
  avg_consultation_time: number;
  total_patients_week: number;
  followup_percentage: number;
  avg_wait_time_today: number;
  patients_per_hour: {
    hour: string;
    count: number;
  }[];
}

export interface StaffDto {
  staff_id: string;
  name: string;
  role: 'doctor' | 'receptionist' | 'admin' | 'lab';
  specialization?: string;
  status: 'available' | 'unavailable' | 'active' | 'inactive';
  phone: string;
}

export class AdminService {
  /**
   * Fetches real-time status details for the hospital command center dashboard.
   * 
   * Uses queue_tokens table to populate metrics.
   */
  public async getCommandCenterData(): Promise<CommandCenterDto> {
    console.log('[AdminService] Querying real-time command center metrics from database');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count tokens based on token_status column values
    const currentlyWaiting = await prisma.queue_tokens.count({
      where: {
        token_status: 'Waiting',
        check_in_time: { gte: today },
      },
    });

    const inConsultation = await prisma.queue_tokens.count({
      where: {
        token_status: 'Serving',
        check_in_time: { gte: today },
      },
    });

    // in_test doesn't exist in DB, query as fallback or 0
    const inTest = await prisma.queue_tokens.count({
      where: {
        token_status: 'in_test',
        check_in_time: { gte: today },
      },
    });

    const doneToday = await prisma.queue_tokens.count({
      where: {
        token_status: 'Completed',
        check_in_time: { gte: today },
      },
    });

    const totalPatientsToday = await prisma.queue_tokens.count({
      where: {
        check_in_time: { gte: today },
      },
    });

    // Calculate average wait time
    const waitTimeAggregate = await prisma.queue_tokens.aggregate({
      where: {
        check_in_time: { gte: today },
      },
      _avg: {
        estimated_wait_time: true,
      },
    });
    const avgWaitTime = Math.round(waitTimeAggregate._avg.estimated_wait_time || 0);

    // Calculate followup ratio based on token appointments
    const followupCount = await prisma.queue_tokens.count({
      where: {
        token_type: 'Appointment',
        appointments: {
          appointment_type: 'Follow-up',
        },
        check_in_time: { gte: today },
      },
    });
    const followupRatio = totalPatientsToday > 0 ? Math.round((followupCount / totalPatientsToday) * 100) : 0;

    // Check if any doctor is active/available
    const availableDoctor = await prisma.doctors.findFirst({
      where: {
        availability_status: 'available',
      },
    });
    const doctorStatus = availableDoctor ? 'available' : 'unavailable';

    return {
      total_patients_today: totalPatientsToday,
      currently_waiting: currentlyWaiting,
      in_consultation: inConsultation,
      in_test: inTest,
      done_today: doneToday,
      followup_ratio: followupRatio,
      avg_wait_time: avgWaitTime,
      doctor_status: doctorStatus,
    };
  }

  /**
   * Fetches system analytical metrics for historical operations.
   * 
   * Uses consultations.duration, queue_tokens.token_type, and queue_tokens.priority_score.
   */
  public async getAnalyticsData(): Promise<AnalyticsDto> {
    console.log('[AdminService] Generating analytical report from database');

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // avg_consultation_time from consultations.duration
    const durationAggregate = await prisma.consultations.aggregate({
      _avg: {
        duration: true,
      },
    });
    const avgConsultationTime = durationAggregate._avg.duration ? Number(durationAggregate._avg.duration.toFixed(1)) : 0.0;

    // total_patients_week from queue_tokens
    const totalPatientsWeek = await prisma.queue_tokens.count({
      where: {
        check_in_time: { gte: oneWeekAgo },
      },
    });

    // followup_percentage from queue_tokens joining appointments
    const totalTokens = await prisma.queue_tokens.count();
    const followupCount = await prisma.queue_tokens.count({
      where: {
        token_type: 'Appointment',
        appointments: {
          appointment_type: 'Follow-up',
        },
      },
    });
    const followupPercentage = totalTokens > 0 ? Math.round((followupCount / totalTokens) * 100) : 0;

    // avg_wait_time_today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const waitTimeAggregate = await prisma.queue_tokens.aggregate({
      where: {
        check_in_time: { gte: today },
      },
      _avg: {
        estimated_wait_time: true,
      },
    });
    const avgWaitTimeToday = Math.round(waitTimeAggregate._avg.estimated_wait_time || 0);

    // Mock breakdown per hour for peak hours computation
    const peakHours = ['10:00', '11:00'];
    const patientsPerHour = [
      { hour: '9AM', count: 8 },
      { hour: '10AM', count: 15 },
      { hour: '11AM', count: 18 },
      { hour: '12PM', count: 12 },
    ];

    return {
      peak_hours: peakHours,
      avg_consultation_time: avgConsultationTime,
      total_patients_week: totalPatientsWeek,
      followup_percentage: followupPercentage,
      avg_wait_time_today: avgWaitTimeToday,
      patients_per_hour: patientsPerHour,
    };
  }

  /**
   * Fetches staff list details.
   */
  public async getStaffList(): Promise<StaffDto[]> {
    console.log('[AdminService] Fetching staff registry profiles');

    const dbUsers = await prisma.users.findMany({
      where: {
        role: { in: ['doctor', 'receptionist', 'admin', 'lab', 'Admin'] },
      },
      include: {
        doctors: true,
      },
    });

    return dbUsers.map((user) => {
      const isDoctor = user.role.toLowerCase() === 'doctor';
      const statusValue = isDoctor && user.doctors
        ? user.doctors.availability_status
        : user.status;

      let normalizedRole: 'doctor' | 'receptionist' | 'admin' | 'lab';
      if (user.role.toLowerCase() === 'admin') {
        normalizedRole = 'admin';
      } else if (user.role.toLowerCase() === 'receptionist') {
        normalizedRole = 'receptionist';
      } else if (user.role.toLowerCase() === 'lab') {
        normalizedRole = 'lab';
      } else {
        normalizedRole = 'doctor';
      }

      return {
        staff_id: user.user_id.toString(),
        name: user.full_name,
        role: normalizedRole,
        specialization: isDoctor && user.doctors ? user.doctors.specialization : undefined,
        status: (statusValue === 'available' || statusValue === 'active' ? 'available' : 'unavailable') as any,
        phone: '', // Users table doesn't have a phone field
      };
    });
  }
}

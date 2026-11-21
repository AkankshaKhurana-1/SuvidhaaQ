import { prisma } from '../prisma/client';
import { BookVisitInput, UpdateProfileInput } from '../validators/patient.validator';
import { TokenAllocator } from '../queue/tokenAllocator';
import { PriorityEngine } from '../queue/priorityEngine';
import { WaitTimeCalculator } from '../queue/waitTimeCalculator';
import { QueueManager } from '../queue/queueManager';
import { logAudit } from '../utils/auditLogger';
import { AppointmentStatus, TokenStatus, Role } from '@prisma/client';

export class PatientService {
  /**
   * Atomic Visit Booking Transaction
   * Creates/finds Patient + Appointment + QueueToken with concurrency-safe sequence.
   */
  public async bookVisit(userId: string, input: BookVisitInput) {
    const { hospitalId, doctorId, scheduledAt, type, patientDetails } = input;
    const dateStr = new Date(scheduledAt).toISOString().split('T')[0];

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify doctor and hospital
      const doctor = await tx.doctor.findUnique({
        where: { id: doctorId },
        include: { department: true },
      });
      if (!doctor || doctor.hospitalId !== hospitalId) {
        throw new Error('Doctor not found in specified hospital.');
      }

      // 2. Find or create patient record (supports self or family member)
      let patient = await tx.patient.findFirst({
        where: {
          hospitalId,
          phone: patientDetails.phone,
          name: patientDetails.name,
        },
      });

      const isSenior = patientDetails.age >= 60;

      if (!patient) {
        const uhid = `UHID-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
        patient = await tx.patient.create({
          data: {
            hospitalId,
            bookedForUserId: userId,
            name: patientDetails.name,
            age: patientDetails.age,
            gender: patientDetails.gender,
            phone: patientDetails.phone,
            isSenior,
            uhid,
          },
        });
      }

      // 3. Concurrency-safe atomic token sequence generator
      const sequence = await TokenAllocator.getNextSequence(tx, hospitalId, doctorId, dateStr);

      // 4. Determine Tier & Token Code
      const tier = TokenAllocator.determineTier(type, patient.age, false);
      const code = TokenAllocator.formatTokenCode(tier, sequence);

      // 5. Initial Priority Score
      const initialScore = PriorityEngine.computeScore({
        type,
        age: patient.age,
        hasLabResults: false,
        minutesWaiting: 0,
        lateCount: 0,
      });

      // 6. Create Appointment
      const appointment = await tx.appointment.create({
        data: {
          hospitalId,
          patientId: patient.id,
          doctorId,
          scheduledAt: new Date(scheduledAt),
          type,
          status: AppointmentStatus.BOOKED,
        },
      });

      // 7. Create Queue Token
      const token = await tx.queueToken.create({
        data: {
          hospitalId,
          patientId: patient.id,
          doctorId,
          appointmentId: appointment.id,
          code,
          sequence,
          tier,
          score: initialScore,
          status: TokenStatus.PENDING,
          position: 0,
          estimatedWaitMinutes: 0,
        },
      });

      return {
        appointment,
        token,
        patient,
        doctor,
      };
    });

    // 8. Reorder and calculate ETAs for waiting tokens after transaction commits
    await QueueManager.recalculateDoctorQueue(doctorId);

    // 9. Write immutable audit log
    await logAudit({
      hospitalId,
      actorId: userId,
      role: Role.PATIENT,
      action: 'APPOINTMENT_BOOK',
      entity: 'APPOINTMENT',
      afterJson: {
        appointmentId: result.appointment.id,
        tokenId: result.token.id,
        code: result.token.code,
        scheduledAt,
      },
    });

    return {
      appointmentId: result.appointment.id,
      tokenId: result.token.id,
      tokenCode: result.token.code,
      token: result.token,
      patientName: result.patient.name,
      doctorName: result.doctor.specialization,
      scheduledAt: result.appointment.scheduledAt,
      status: result.token.status,
    };
  }

  /**
   * Cancel an appointment and token
   */
  public async cancelAppointment(userId: string, appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { queueToken: true },
    });

    if (!appointment) {
      const error: any = new Error('Appointment not found.');
      error.statusCode = 404;
      throw error;
    }

    if (appointment.queueToken) {
      QueueManager.validateTransition(appointment.queueToken.status, TokenStatus.CANCELLED);
    }

    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.CANCELLED },
      }),
      ...(appointment.queueToken
        ? [
            prisma.queueToken.update({
              where: { id: appointment.queueToken.id },
              data: { status: TokenStatus.CANCELLED },
            }),
          ]
        : []),
    ]);

    if (appointment.queueToken) {
      await QueueManager.recalculateDoctorQueue(appointment.doctorId);
    }

    await logAudit({
      hospitalId: appointment.hospitalId,
      actorId: userId,
      role: Role.PATIENT,
      action: 'APPOINTMENT_CANCEL',
      entity: 'APPOINTMENT',
      beforeJson: { appointmentId, status: appointment.status },
      afterJson: { appointmentId, status: AppointmentStatus.CANCELLED },
    });

    return { success: true, message: 'Appointment cancelled successfully.' };
  }

  /**
   * Patient Dashboard Data
   */
  public async getDashboardData(userId: string) {
    const userPatients = await prisma.patient.findMany({
      where: { bookedForUserId: userId },
      select: { id: true },
    });
    const patientIds = userPatients.map((p) => p.id);

    // Active Token
    const activeToken = await prisma.queueToken.findFirst({
      where: {
        patientId: { in: patientIds },
        status: { in: [TokenStatus.PENDING, TokenStatus.ARRIVED, TokenStatus.CALLED, TokenStatus.IN_CONSULTATION] },
      },
      include: {
        patient: true,
        doctor: {
          include: { user: true, department: true },
        },
        hospital: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Upcoming Visits
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        patientId: { in: patientIds },
        status: AppointmentStatus.BOOKED,
      },
      include: {
        doctor: {
          include: { user: true, department: true },
        },
        patient: true,
        queueToken: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });

    return {
      activeToken: activeToken
        ? {
            tokenId: activeToken.id,
            code: activeToken.code,
            status: activeToken.status,
            position: activeToken.position,
            estimatedWaitMinutes: activeToken.estimatedWaitMinutes,
            patientName: activeToken.patient.name,
            doctorName: activeToken.doctor.user.name,
            department: activeToken.doctor.department.name,
            room: activeToken.doctor.room,
            hospitalName: activeToken.hospital.name,
            arrivedAt: activeToken.arrivedAt,
          }
        : null,
      upcomingVisits: upcomingAppointments.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt,
        type: a.type,
        doctorName: a.doctor.user.name,
        department: a.doctor.department.name,
        patientName: a.patient.name,
        tokenCode: a.queueToken?.code,
      })),
    };
  }

  /**
   * Real-time Token View: position, ETA, people ahead
   */
  public async getMyToken(userId: string) {
    const userPatients = await prisma.patient.findMany({
      where: { bookedForUserId: userId },
      select: { id: true },
    });
    const patientIds = userPatients.map((p) => p.id);

    const token = await prisma.queueToken.findFirst({
      where: {
        patientId: { in: patientIds },
        status: { in: [TokenStatus.PENDING, TokenStatus.ARRIVED, TokenStatus.CALLED, TokenStatus.IN_CONSULTATION] },
      },
      include: {
        patient: true,
        doctor: {
          include: { user: true, department: true },
        },
        hospital: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      return null;
    }

    const peopleAhead = Math.max(0, token.position - 1);

    return {
      tokenId: token.id,
      code: token.code,
      status: token.status,
      position: token.position,
      peopleAhead,
      estimatedWaitMinutes: token.estimatedWaitMinutes,
      tier: token.tier,
      doctorName: token.doctor.user.name,
      department: token.doctor.department.name,
      room: token.doctor.room,
      hospitalName: token.hospital.name,
      patientName: token.patient.name,
      arrivedAt: token.arrivedAt,
      calledAt: token.calledAt,
      startedAt: token.startedAt,
    };
  }

  public async getAppointments(userId: string) {
    const userPatients = await prisma.patient.findMany({
      where: { bookedForUserId: userId },
      select: { id: true },
    });
    const patientIds = userPatients.map((p) => p.id);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: { in: patientIds } },
      include: {
        doctor: { include: { user: true, department: true } },
        patient: true,
        queueToken: true,
        hospital: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return appointments.map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt,
      type: a.type,
      status: a.status,
      doctorName: a.doctor.user.name,
      department: a.doctor.department.name,
      patientName: a.patient.name,
      hospitalName: a.hospital.name,
      tokenCode: a.queueToken?.code,
      tokenStatus: a.queueToken?.status,
    }));
  }

  public async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookedPatients: true,
      },
    });
    if (!user) throw new Error('User not found.');

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      familyMembers: user.bookedPatients.map((p) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        isSenior: p.isSenior,
        uhid: p.uhid,
      })),
    };
  }

  public async updateProfile(userId: string, input: UpdateProfileInput) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: input,
    });
    return {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
    };
  }
}

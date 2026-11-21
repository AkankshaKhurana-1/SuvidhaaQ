import { prisma } from '../prisma/client';
import {
  TokenStatus,
  QueueTier,
  AppointmentType,
  AppointmentStatus,
  Role,
} from '@prisma/client';
import {
  WalkInInput,
  EmergencyInput,
  CompleteConsultationInput,
} from '../validators/queue.validator';
import { TokenAllocator } from '../queue/tokenAllocator';
import { PriorityEngine } from '../queue/priorityEngine';
import { QueueManager } from '../queue/queueManager';
import { logAudit } from '../utils/auditLogger';
import { getIO } from '../sockets';

export class QueueService {
  /**
   * Helper to emit real-time Socket.IO events after DB updates commit.
   */
  private emitQueueUpdate(hospitalId: string, doctorId: string, event: string, data: any) {
    const io = getIO();
    if (io) {
      const room = `hospital:${hospitalId}:doctor:${doctorId}`;
      io.to(room).emit(event, data);
      io.to(room).emit('queue:update', { doctorId, timestamp: new Date() });
    }
  }

  /**
   * Register a walk-in patient and issue token.
   */
  public async registerWalkIn(hospitalId: string, actorId: string, role: Role, input: WalkInInput) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const doctor = await prisma.doctor.findUnique({
      where: { id: input.doctorId },
      include: { department: true },
    });
    if (!doctor || doctor.hospitalId !== hospitalId) {
      throw new Error('Doctor not found in this hospital.');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find or create patient
      let patient = await tx.patient.findFirst({
        where: { hospitalId, phone: input.phone, name: input.name },
      });

      if (!patient) {
        patient = await tx.patient.create({
          data: {
            hospitalId,
            name: input.name,
            age: input.age,
            gender: input.gender,
            phone: input.phone,
            isSenior: input.age >= 60,
            uhid: `UHID-2026-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`,
          },
        });
      }

      // Concurrency-safe sequence
      const sequence = await TokenAllocator.getNextSequence(tx, hospitalId, doctor.id, dateStr);
      const tier = TokenAllocator.determineTier(AppointmentType.WALK_IN, patient.age, false);
      const code = TokenAllocator.formatTokenCode(tier, sequence);

      const initialScore = PriorityEngine.computeScore({
        type: AppointmentType.WALK_IN,
        age: patient.age,
        hasLabResults: false,
        minutesWaiting: 0,
        lateCount: 0,
      });

      // Walk-in is automatically ARRIVED at front desk
      const token = await tx.queueToken.create({
        data: {
          hospitalId,
          patientId: patient.id,
          doctorId: doctor.id,
          code,
          sequence,
          tier,
          score: initialScore,
          status: TokenStatus.ARRIVED,
          position: 0,
          estimatedWaitMinutes: 0,
          arrivedAt: new Date(),
        },
      });

      return { token, patient };
    });

    await QueueManager.recalculateDoctorQueue(doctor.id);
    this.emitQueueUpdate(hospitalId, doctor.id, 'token:generated', result.token);

    await logAudit({
      hospitalId,
      actorId,
      role,
      action: 'QUEUE_WALKIN_REGISTER',
      entity: 'TOKEN',
      afterJson: { tokenId: result.token.id, code: result.token.code, doctorId: doctor.id },
    });

    return result.token;
  }

  /**
   * Mark token as arrived at reception.
   */
  public async markArrived(hospitalId: string, actorId: string, role: Role, tokenId: string) {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { doctor: true, appointment: true },
    });
    if (!token || token.hospitalId !== hospitalId) {
      const error: any = new Error('Token not found in this hospital.');
      error.statusCode = 404;
      throw error;
    }

    QueueManager.validateTransition(token.status, TokenStatus.ARRIVED);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.queueToken.update({
        where: { id: tokenId },
        data: {
          status: TokenStatus.ARRIVED,
          arrivedAt: new Date(),
        },
      });

      if (token.appointmentId) {
        await tx.appointment.update({
          where: { id: token.appointmentId },
          data: { status: AppointmentStatus.ARRIVED },
        });
      }
      return u;
    });

    await QueueManager.recalculateDoctorQueue(token.doctorId);
    this.emitQueueUpdate(hospitalId, token.doctorId, 'token:arrived', updated);

    await logAudit({
      hospitalId,
      actorId,
      role,
      action: 'TOKEN_ARRIVED',
      entity: 'TOKEN',
      beforeJson: { tokenId, status: token.status },
      afterJson: { tokenId, status: TokenStatus.ARRIVED },
    });

    return updated;
  }

  /**
   * Mark token as no-show.
   */
  public async markNoShow(hospitalId: string, actorId: string, role: Role, tokenId: string) {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
    });
    if (!token || token.hospitalId !== hospitalId) {
      const error: any = new Error('Token not found.');
      error.statusCode = 404;
      throw error;
    }

    QueueManager.validateTransition(token.status, TokenStatus.NO_SHOW);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.queueToken.update({
        where: { id: tokenId },
        data: {
          status: TokenStatus.NO_SHOW,
          lateCount: token.lateCount + 1,
        },
      });

      if (token.appointmentId) {
        await tx.appointment.update({
          where: { id: token.appointmentId },
          data: { status: AppointmentStatus.NO_SHOW },
        });
      }
      return u;
    });

    await QueueManager.recalculateDoctorQueue(token.doctorId);
    this.emitQueueUpdate(hospitalId, token.doctorId, 'token:no_show', updated);

    await logAudit({
      hospitalId,
      actorId,
      role,
      action: 'TOKEN_NO_SHOW',
      entity: 'TOKEN',
      beforeJson: { tokenId, status: token.status },
      afterJson: { tokenId, status: TokenStatus.NO_SHOW },
    });

    return updated;
  }

  /**
   * Flag an emergency patient (Tier 1, Score 100).
   */
  public async flagEmergency(hospitalId: string, actorId: string, role: Role, input: EmergencyInput) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const doctor = await prisma.doctor.findUnique({
      where: { id: input.doctorId },
    });
    if (!doctor || doctor.hospitalId !== hospitalId) {
      throw new Error('Doctor not found in this hospital.');
    }

    const result = await prisma.$transaction(async (tx) => {
      let patient = await tx.patient.findFirst({
        where: { hospitalId, phone: input.phone, name: input.name },
      });

      if (!patient) {
        patient = await tx.patient.create({
          data: {
            hospitalId,
            name: input.name,
            age: input.age,
            gender: input.gender,
            phone: input.phone,
            isSenior: input.age >= 60,
            uhid: `EMG-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`,
          },
        });
      }

      const sequence = await TokenAllocator.getNextSequence(tx, hospitalId, doctor.id, dateStr);
      const code = TokenAllocator.formatTokenCode(QueueTier.EMERGENCY, sequence);

      const token = await tx.queueToken.create({
        data: {
          hospitalId,
          patientId: patient.id,
          doctorId: doctor.id,
          code,
          sequence,
          tier: QueueTier.EMERGENCY,
          score: 100, // Top priority
          status: TokenStatus.ARRIVED,
          position: 1, // Immediately prioritized
          estimatedWaitMinutes: 0,
          arrivedAt: new Date(),
        },
      });

      return { token, patient };
    });

    await QueueManager.recalculateDoctorQueue(doctor.id);
    this.emitQueueUpdate(hospitalId, doctor.id, 'emergency:alert', result.token);

    await logAudit({
      hospitalId,
      actorId,
      role,
      action: 'FLAG_EMERGENCY',
      entity: 'TOKEN',
      afterJson: { tokenId: result.token.id, code: result.token.code, reason: input.reason },
    });

    return result.token;
  }

  /**
   * Live queue board for receptionist or doctors
   */
  public async getLiveQueue(hospitalId: string, doctorId?: string, departmentId?: string) {
    const whereDoctor: any = { hospitalId };
    if (doctorId) whereDoctor.id = doctorId;
    if (departmentId) whereDoctor.departmentId = departmentId;

    const doctors = await prisma.doctor.findMany({
      where: whereDoctor,
      include: {
        user: { select: { name: true, email: true } },
        department: { select: { id: true, name: true } },
        queueTokens: {
          where: {
            status: { in: [TokenStatus.ARRIVED, TokenStatus.CALLED, TokenStatus.IN_CONSULTATION] },
          },
          include: {
            patient: true,
          },
          orderBy: [{ tier: 'asc' }, { score: 'desc' }, { arrivedAt: 'asc' }],
        },
      },
    });

    return doctors.map((doc) => {
      const active = doc.queueTokens.find((t) => t.status === TokenStatus.IN_CONSULTATION);
      const called = doc.queueTokens.find((t) => t.status === TokenStatus.CALLED);
      const waiting = doc.queueTokens.filter((t) => t.status === TokenStatus.ARRIVED);

      return {
        doctorId: doc.id,
        doctorName: doc.user.name,
        department: doc.department.name,
        room: doc.room,
        available: doc.available,
        sessionDelay: doc.sessionDelay,
        activePatient: active
          ? {
              tokenId: active.id,
              code: active.code,
              patientName: active.patient.name,
              startedAt: active.startedAt,
              tier: active.tier,
            }
          : null,
        calledPatient: called
          ? {
              tokenId: called.id,
              code: called.code,
              patientName: called.patient.name,
              calledAt: called.calledAt,
              tier: called.tier,
            }
          : null,
        waitingQueue: waiting.map((w, idx) => ({
          tokenId: w.id,
          code: w.code,
          patientName: w.patient.name,
          age: w.patient.age,
          gender: w.patient.gender,
          tier: w.tier,
          score: w.score,
          position: idx + 1,
          estimatedWaitMinutes: w.estimatedWaitMinutes,
          arrivedAt: w.arrivedAt,
        })),
        totalWaiting: waiting.length,
      };
    });
  }

  /**
   * Search hospital patients by name/phone/UHID
   */
  public async searchPatients(hospitalId: string, search = '') {
    return prisma.patient.findMany({
      where: {
        hospitalId,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { uhid: { contains: search, mode: 'insensitive' } },
        ],
      },
      include: {
        appointments: {
          take: 3,
          orderBy: { scheduledAt: 'desc' },
          include: { doctor: { include: { user: true } } },
        },
      },
      take: 20,
    });
  }

  /**
   * Doctor Queue Workstation (scoped strictly to doctor's own queue)
   */
  public async getDoctorQueue(doctorId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true, department: true },
    });
    if (!doctor) throw new Error('Doctor not found.');

    const activeToken = await prisma.queueToken.findFirst({
      where: { doctorId, status: TokenStatus.IN_CONSULTATION },
      include: { patient: { include: { labReports: true } }, appointment: true },
    });

    const calledToken = await prisma.queueToken.findFirst({
      where: { doctorId, status: TokenStatus.CALLED },
      include: { patient: { include: { labReports: true } }, appointment: true },
    });

    const waitingQueue = await prisma.queueToken.findMany({
      where: { doctorId, status: TokenStatus.ARRIVED },
      include: { patient: { include: { labReports: true } }, appointment: true },
      orderBy: [{ score: 'desc' }, { arrivedAt: 'asc' }],
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedToday = await prisma.queueToken.count({
      where: { doctorId, status: TokenStatus.COMPLETED, completedAt: { gte: todayStart } },
    });

    return {
      doctorId: doctor.id,
      doctorName: doctor.user.name,
      department: doctor.department.name,
      room: doctor.room,
      available: doctor.available,
      sessionDelay: doctor.sessionDelay,
      currentPatient: activeToken
        ? {
            tokenId: activeToken.id,
            code: activeToken.code,
            patientId: activeToken.patient.id,
            patientName: activeToken.patient.name,
            age: activeToken.patient.age,
            gender: activeToken.patient.gender,
            tier: activeToken.tier,
            visitType: activeToken.appointment?.type || 'WALK_IN',
            hasLabReady: activeToken.patient.labReports.some((r) => r.status === 'Ready'),
            startedAt: activeToken.startedAt,
          }
        : calledToken
        ? {
            tokenId: calledToken.id,
            code: calledToken.code,
            patientId: calledToken.patient.id,
            patientName: calledToken.patient.name,
            age: calledToken.patient.age,
            gender: calledToken.patient.gender,
            tier: calledToken.tier,
            visitType: calledToken.appointment?.type || 'WALK_IN',
            hasLabReady: calledToken.patient.labReports.some((r) => r.status === 'Ready'),
            calledAt: calledToken.calledAt,
            isCalled: true,
          }
        : null,
      upNext: waitingQueue.slice(0, 5).map((w, idx) => ({
        tokenId: w.id,
        code: w.code,
        patientName: w.patient.name,
        age: w.patient.age,
        tier: w.tier,
        score: w.score,
        position: idx + 1,
        estimatedWaitMinutes: w.estimatedWaitMinutes,
        hasLabReady: w.patient.labReports.some((r) => r.status === 'Ready'),
      })),
      summary: {
        seenToday: completedToday,
        remainingInQueue: waitingQueue.length + (calledToken ? 1 : 0),
        sessionDelayMinutes: doctor.sessionDelay,
      },
    };
  }

  /**
   * Doctor calls next patient
   */
  public async callNext(doctorId: string, actorId: string) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new Error('Doctor not found.');

    // Top arrived patient in queue
    const nextInLine = await prisma.queueToken.findFirst({
      where: { doctorId, status: TokenStatus.ARRIVED },
      orderBy: [{ score: 'desc' }, { arrivedAt: 'asc' }],
      include: { patient: true },
    });

    if (!nextInLine) {
      return { message: 'Queue is empty. No arrived patients waiting.' };
    }

    QueueManager.validateTransition(nextInLine.status, TokenStatus.CALLED);

    const updated = await prisma.queueToken.update({
      where: { id: nextInLine.id },
      data: {
        status: TokenStatus.CALLED,
        calledAt: new Date(),
      },
      include: { patient: true },
    });

    await QueueManager.recalculateDoctorQueue(doctorId);
    this.emitQueueUpdate(doctor.hospitalId, doctorId, 'token:called', updated);

    await logAudit({
      hospitalId: doctor.hospitalId,
      actorId,
      role: Role.DOCTOR,
      action: 'CALL_NEXT_PATIENT',
      entity: 'TOKEN',
      afterJson: { tokenId: updated.id, code: updated.code, patient: updated.patient.name },
    });

    return updated;
  }

  /**
   * Doctor starts consultation
   */
  public async startConsultation(doctorId: string, tokenId: string, actorId: string) {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { doctor: true, patient: true },
    });
    if (!token || token.doctorId !== doctorId) {
      throw new Error('Token does not belong to this doctor.');
    }

    QueueManager.validateTransition(token.status, TokenStatus.IN_CONSULTATION);

    const updated = await prisma.queueToken.update({
      where: { id: tokenId },
      data: {
        status: TokenStatus.IN_CONSULTATION,
        startedAt: new Date(),
      },
    });

    await QueueManager.recalculateDoctorQueue(doctorId);
    this.emitQueueUpdate(token.doctor.hospitalId, doctorId, 'consultation:start', updated);

    await logAudit({
      hospitalId: token.doctor.hospitalId,
      actorId,
      role: Role.DOCTOR,
      action: 'START_CONSULTATION',
      entity: 'TOKEN',
      afterJson: { tokenId, code: token.code, patientId: token.patientId },
    });

    return updated;
  }

  /**
   * Doctor completes consultation
   */
  public async completeConsultation(
    doctorId: string,
    tokenId: string,
    actorId: string,
    input: CompleteConsultationInput
  ) {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { doctor: true, patient: true },
    });
    if (!token || token.doctorId !== doctorId) {
      throw new Error('Token does not belong to this doctor.');
    }

    QueueManager.validateTransition(token.status, TokenStatus.COMPLETED);

    const now = new Date();
    const started = token.startedAt ? new Date(token.startedAt) : new Date(now.getTime() - 15 * 60000);
    const durationMinutes = Math.max(1, Math.round((now.getTime() - started.getTime()) / 60000));
    const plannedDuration = token.tier === QueueTier.FOLLOW_UP ? 8 : 15;
    const sessionDelayDelta = durationMinutes - plannedDuration;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark token COMPLETED
      const completedToken = await tx.queueToken.update({
        where: { id: tokenId },
        data: {
          status: TokenStatus.COMPLETED,
          completedAt: now,
        },
      });

      // 2. Create Consultation record
      const consultation = await tx.consultation.create({
        data: {
          hospitalId: token.hospitalId,
          tokenId: token.id,
          doctorId: token.doctorId,
          patientId: token.patientId,
          notes: input.notes,
          followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
          startedAt: started,
          endedAt: now,
          durationMinutes,
        },
      });

      // 3. Update Doctor session delay
      await tx.doctor.update({
        where: { id: doctorId },
        data: {
          sessionDelay: { increment: sessionDelayDelta },
        },
      });

      // 4. Update appointment status if linked
      if (token.appointmentId) {
        await tx.appointment.update({
          where: { id: token.appointmentId },
          data: { status: AppointmentStatus.COMPLETED },
        });
      }

      return { completedToken, consultation };
    });

    // Recalculate remaining queue
    await QueueManager.recalculateDoctorQueue(doctorId);
    this.emitQueueUpdate(token.hospitalId, doctorId, 'token:completed', result.completedToken);

    await logAudit({
      hospitalId: token.hospitalId,
      actorId,
      role: Role.DOCTOR,
      action: 'COMPLETE_CONSULTATION',
      entity: 'CONSULTATION',
      afterJson: {
        consultationId: result.consultation.id,
        durationMinutes,
        sessionDelayDelta,
      },
    });

    return result;
  }

  public async getDoctorHistory(doctorId: string) {
    return prisma.consultation.findMany({
      where: { doctorId },
      include: {
        patient: true,
        token: true,
      },
      orderBy: { endedAt: 'desc' },
      take: 50,
    });
  }

  public async updateDoctorAvailability(doctorId: string, available: boolean, actorId: string) {
    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: { available },
    });

    await logAudit({
      hospitalId: updated.hospitalId,
      actorId,
      role: Role.DOCTOR,
      action: 'UPDATE_DOCTOR_AVAILABILITY',
      entity: 'DOCTOR',
      afterJson: { doctorId, available },
    });

    this.emitQueueUpdate(updated.hospitalId, doctorId, 'doctor:availability', { doctorId, available });
    return updated;
  }
}

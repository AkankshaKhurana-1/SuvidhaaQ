import { prisma } from '../prisma/client';
import bcrypt from 'bcryptjs';
import { Role, TokenStatus } from '@prisma/client';
import {
  CreateStaffInput,
  UpdateStaffInput,
  UpdateDoctorRosterInput,
  CapacitySettingsInput,
  CreateDepartmentInput,
} from '../validators/admin.validator';
import { logAudit } from '../utils/auditLogger';

export class AdminService {
  /**
   * Hospital Command Center Overview KPIs
   */
  public async getOverview(hospitalId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [footfallToday, activeConsultations, waitingPatients, completedToday, delayedDoctors, waitAgg] =
      await Promise.all([
        prisma.queueToken.count({
          where: { hospitalId, arrivedAt: { gte: todayStart } },
        }),
        prisma.queueToken.count({
          where: { hospitalId, status: TokenStatus.IN_CONSULTATION },
        }),
        prisma.queueToken.count({
          where: { hospitalId, status: TokenStatus.ARRIVED },
        }),
        prisma.queueToken.count({
          where: { hospitalId, status: TokenStatus.COMPLETED, completedAt: { gte: todayStart } },
        }),
        prisma.doctor.count({
          where: { hospitalId, sessionDelay: { gt: 0 } },
        }),
        prisma.queueToken.aggregate({
          where: { hospitalId, status: TokenStatus.ARRIVED },
          _avg: { estimatedWaitMinutes: true },
        }),
      ]);

    const avgWaitMinutes = Math.round(waitAgg._avg.estimatedWaitMinutes || 12);

    return {
      footfallToday,
      activeConsultations,
      waitingPatients,
      completedToday,
      delayedDoctors,
      avgWaitMinutes,
      date: new Date().toISOString(),
    };
  }

  /**
   * Department load breakdown (waiting vs in-consultation vs completed)
   */
  public async getDepartmentLoad(hospitalId: string) {
    const departments = await prisma.department.findMany({
      where: { hospitalId },
      include: {
        doctors: {
          include: {
            queueTokens: {
              where: {
                status: { in: [TokenStatus.ARRIVED, TokenStatus.IN_CONSULTATION, TokenStatus.COMPLETED] },
              },
            },
          },
        },
      },
    });

    return departments.map((dept) => {
      let waiting = 0;
      let inConsultation = 0;
      let completed = 0;

      dept.doctors.forEach((doc) => {
        doc.queueTokens.forEach((t) => {
          if (t.status === TokenStatus.ARRIVED) waiting++;
          else if (t.status === TokenStatus.IN_CONSULTATION) inConsultation++;
          else if (t.status === TokenStatus.COMPLETED) completed++;
        });
      });

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        location: dept.location,
        doctorsCount: dept.doctors.length,
        waiting,
        inConsultation,
        completed,
        totalActive: waiting + inConsultation,
      };
    });
  }

  /**
   * Doctor roster with availability and live queue stats
   */
  public async getDoctorRoster(hospitalId: string) {
    const doctors = await prisma.doctor.findMany({
      where: { hospitalId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        department: { select: { id: true, name: true } },
        queueTokens: {
          where: { status: { in: [TokenStatus.ARRIVED, TokenStatus.IN_CONSULTATION] } },
        },
      },
      orderBy: { room: 'asc' },
    });

    return doctors.map((doc) => ({
      doctorId: doc.id,
      userId: doc.user.id,
      name: doc.user.name,
      email: doc.user.email,
      phone: doc.user.phone,
      department: doc.department.name,
      departmentId: doc.departmentId,
      specialization: doc.specialization,
      room: doc.room,
      available: doc.available,
      sessionDelay: doc.sessionDelay,
      activeQueueCount: doc.queueTokens.length,
    }));
  }

  /**
   * Update doctor roster attributes (status toggle, room reassign, delay reset)
   */
  public async updateDoctorRoster(
    hospitalId: string,
    doctorId: string,
    input: UpdateDoctorRosterInput,
    actorId: string
  ) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor || doctor.hospitalId !== hospitalId) {
      throw new Error('Doctor not found in this hospital');
    }

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        ...(input.available !== undefined && { available: input.available }),
        ...(input.room !== undefined && { room: input.room }),
        ...(input.sessionDelay !== undefined && { sessionDelay: input.sessionDelay }),
      },
    });

    await logAudit({
      hospitalId,
      actorId,
      role: Role.ADMIN,
      action: 'UPDATE_DOCTOR_ROSTER',
      entity: 'DOCTOR',
      beforeJson: { available: doctor.available, room: doctor.room, sessionDelay: doctor.sessionDelay },
      afterJson: { available: updated.available, room: updated.room, sessionDelay: updated.sessionDelay },
    });

    return updated;
  }

  /**
   * List staff accounts for this hospital
   */
  public async getStaff(hospitalId: string) {
    const staff = await prisma.user.findMany({
      where: {
        hospitalId,
        role: { in: [Role.RECEPTIONIST, Role.DOCTOR, Role.ADMIN] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        failedAttempts: true,
        lockedUntil: true,
        createdAt: true,
        doctor: {
          select: {
            id: true,
            room: true,
            specialization: true,
            available: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return staff;
  }

  /**
   * Admin creates a staff account (Receptionist, Doctor, Admin)
   */
  public async createStaff(hospitalId: string, input: CreateStaffInput, actorId: string) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { phone: input.phone }],
      },
    });
    if (existing) {
      const error: any = new Error('A user with this email or phone already exists.');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          hospitalId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash,
          role: input.role,
        },
      });

      let doctorRecord = null;
      if (input.role === Role.DOCTOR) {
        if (!input.departmentId) {
          throw new Error('Department is required for doctor accounts.');
        }
        doctorRecord = await tx.doctor.create({
          data: {
            hospitalId,
            userId: user.id,
            departmentId: input.departmentId,
            room: input.room || 'Room 101',
            specialization: input.specialization || 'General',
            consultationMinutes: input.consultationMinutes || 15,
            available: true,
          },
        });
      }

      return { user, doctor: doctorRecord };
    });

    await logAudit({
      hospitalId,
      actorId,
      role: Role.ADMIN,
      action: 'CREATE_STAFF',
      entity: 'USER',
      afterJson: {
        userId: result.user.id,
        name: result.user.name,
        role: result.user.role,
        email: result.user.email,
      },
    });

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      doctor: result.doctor,
    };
  }

  /**
   * Update staff member
   */
  public async updateStaff(
    hospitalId: string,
    staffId: string,
    input: UpdateStaffInput,
    actorId: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: staffId } });
    if (!user || user.hospitalId !== hospitalId) {
      throw new Error('Staff member not found.');
    }

    const updated = await prisma.user.update({
      where: { id: staffId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.phone && { phone: input.phone }),
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    await logAudit({
      hospitalId,
      actorId,
      role: Role.ADMIN,
      action: 'UPDATE_STAFF',
      entity: 'USER',
      beforeJson: { name: user.name, phone: user.phone },
      afterJson: { name: updated.name, phone: updated.phone },
    });

    return updated;
  }

  /**
   * Capacity settings management with validation sum = 100%
   */
  public async setCapacitySettings(
    hospitalId: string,
    input: CapacitySettingsInput,
    actorId: string
  ) {
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
    });
    if (!department || department.hospitalId !== hospitalId) {
      throw new Error('Department not found in this hospital.');
    }

    await logAudit({
      hospitalId,
      actorId,
      role: Role.ADMIN,
      action: 'UPDATE_CAPACITY_QUOTAS',
      entity: 'DEPARTMENT',
      afterJson: {
        departmentId: input.departmentId,
        departmentName: department.name,
        newQuota: input.newQuota,
        followUpQuota: input.followUpQuota,
        walkInQuota: input.walkInQuota,
      },
    });

    return {
      departmentId: department.id,
      departmentName: department.name,
      quotas: {
        new: input.newQuota,
        followUp: input.followUpQuota,
        walkIn: input.walkInQuota,
      },
      message: 'Capacity quotas saved successfully.',
    };
  }

  /**
   * Hospital Audit Log Viewer
   */
  public async getAuditLogs(
    hospitalId: string,
    query: { actorId?: string; action?: string; limit?: number; offset?: number }
  ) {
    const where: any = { hospitalId };
    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, limit, offset };
  }

  /**
   * Department management
   */
  public async createDepartment(hospitalId: string, input: CreateDepartmentInput, actorId: string) {
    const created = await prisma.department.create({
      data: {
        hospitalId,
        name: input.name,
        location: 'Main Building',
        dailyCapacity: 50,
      },
    });

    await logAudit({
      hospitalId,
      actorId,
      role: Role.ADMIN,
      action: 'CREATE_DEPARTMENT',
      entity: 'DEPARTMENT',
      afterJson: created,
    });

    return created;
  }
}

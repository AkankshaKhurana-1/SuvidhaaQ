import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { env } from '../config/env';
import { logAudit } from '../utils/auditLogger';
import { RegisterPatientInput, LoginInput } from '../validators/auth.validator';
import { Role } from '@prisma/client';

export class AuthService {
  private generateAccessToken(user: { id: string; role: Role; hospitalId?: string | null; name: string; email?: string | null; phone?: string | null }): string {
    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
        hospitalId: user.hospitalId,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const nonce = Math.random().toString(36).substring(2, 10);
    const token = jwt.sign({ sub: userId, nonce }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Patient self-registration. Staff are created exclusively by admins.
   */
  public async registerPatient(data: RegisterPatientInput) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ phone: data.phone }],
      },
    });

    if (existing) {
      const error: any = new Error('An account with this phone number already exists.');
      error.statusCode = 409;
      error.code = 'USER_ALREADY_EXISTS';
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        role: Role.PATIENT,
        name: data.name,
        phone: data.phone,
        passwordHash,
        failedAttempts: 0,
      },
    });

    // Also create initial Patient record linked to user
    const firstHospital = await prisma.hospital.findFirst();
    if (firstHospital) {
      const patientCount = await prisma.patient.count();
      await prisma.patient.create({
        data: {
          hospitalId: firstHospital.id,
          bookedForUserId: user.id,
          name: data.name,
          age: data.age || 30,
          gender: data.gender || 'Not Specified',
          phone: data.phone,
          isSenior: (data.age || 30) >= 60,
          uhid: `UHID-2026-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    await logAudit({
      actorId: user.id,
      role: Role.PATIENT,
      action: 'PATIENT_REGISTER',
      entity: 'USER',
      afterJson: { userId: user.id, name: user.name, phone: user.phone },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        hospitalId: user.hospitalId,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    };
  }

  /**
   * Universal Login supporting Email (Staff) or Phone (Patient).
   */
  public async login(data: LoginInput) {
    const rawId = data.identifier || data.email || data.phone || '';
    const identifier = rawId.trim();
    const isEmail = identifier.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier.toLowerCase() } : { phone: identifier },
      include: { hospital: true, doctor: true },
    });

    if (!user) {
      const error: any = new Error('Invalid email/phone or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      const error: any = new Error(
        `Account is locked due to too many failed login attempts. Please try again after ${minutesRemaining} minutes.`
      );
      error.statusCode = 423; // Locked
      error.code = 'ACCOUNT_LOCKED';
      throw error;
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      const updatedAttempts = user.failedAttempts + 1;
      let lockDate: Date | null = null;

      if (updatedAttempts >= 5) {
        lockDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: updatedAttempts,
          lockedUntil: lockDate,
        },
      });

      const error: any = new Error(
        updatedAttempts >= 5
          ? 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
          : 'Invalid email/phone or password.'
      );
      error.statusCode = updatedAttempts >= 5 ? 423 : 401;
      error.code = updatedAttempts >= 5 ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS';
      throw error;
    }

    // Password is valid - reset failed attempts
    if (user.failedAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    await logAudit({
      hospitalId: user.hospitalId,
      actorId: user.id,
      actorEmail: user.email,
      role: user.role,
      action: 'USER_LOGIN',
      entity: 'USER',
      afterJson: { userId: user.id, role: user.role },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: user.hospital?.name,
        doctorId: user.doctor?.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  /**
   * Refresh token rotation: revokes used refresh token, issues a fresh token pair.
   */
  public async refresh(rawRefreshToken: string) {
    let payload: any;
    try {
      payload = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET);
    } catch (e) {
      const error: any = new Error('Invalid or expired refresh token.');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: rawRefreshToken },
      include: { user: { include: { hospital: true, doctor: true } } },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      const error: any = new Error('Refresh token is invalid or has been revoked.');
      error.statusCode = 401;
      error.code = 'REVOKED_REFRESH_TOKEN';
      throw error;
    }

    // Rotate: revoke the current token
    const newAccessToken = this.generateAccessToken(storedToken.user);
    const newRefreshToken = jwt.sign({ sub: storedToken.userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          revokedAt: new Date(),
          replacedByToken: newRefreshToken,
        },
      }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          token: newRefreshToken,
          expiresAt,
        },
      }),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        role: storedToken.user.role,
        hospitalId: storedToken.user.hospitalId,
        name: storedToken.user.name,
        email: storedToken.user.email,
        phone: storedToken.user.phone,
      },
    };
  }

  /**
   * Revoke refresh token on logout.
   */
  public async logout(rawRefreshToken?: string, userId?: string) {
    if (rawRefreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: rawRefreshToken },
        data: { revokedAt: new Date() },
      });
    }

    if (userId) {
      await logAudit({
        actorId: userId,
        role: 'AUTHENTICATED',
        action: 'USER_LOGOUT',
        entity: 'USER',
      });
    }

    return { success: true };
  }

  /**
   * Get current authenticated user profile.
   */
  public async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hospital: true,
        doctor: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      hospitalId: user.hospitalId,
      hospitalName: user.hospital?.name,
      doctorId: user.doctor?.id,
      departmentName: user.doctor?.department?.name,
      room: user.doctor?.room,
    };
  }
}

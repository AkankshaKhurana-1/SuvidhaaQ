import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/prisma/client';
import { Role } from '@prisma/client';

describe('SuvidhaaQ Full Integration & Permissions Matrix Tests', () => {
  let adminToken: string;
  let receptionToken: string;
  let doctorToken: string;
  let patientToken: string;
  let hospital1Id: string;
  let hospital2Id: string;
  let doctor1Id: string;

  beforeAll(async () => {
    // 1. Fetch seed hospitals and doctors
    const hospitals = await prisma.hospital.findMany();
    expect(hospitals.length).toBeGreaterThanOrEqual(2);
    hospital1Id = hospitals[0].id;
    hospital2Id = hospitals[1].id;

    const doctor = await prisma.doctor.findFirst({
      where: { hospitalId: hospital1Id },
      include: { user: true },
    });
    expect(doctor).toBeDefined();
    doctor1Id = doctor!.id;

    // 2. Obtain tokens via POST /api/v1/auth/login
    // Admin Login
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@suvidhaaq.demo', password: 'Admin@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.accessToken;

    // Receptionist Login
    const receptionRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'reception@suvidhaaq.demo', password: 'Reception@123' });
    expect(receptionRes.status).toBe(200);
    receptionToken = receptionRes.body.data.accessToken;

    // Doctor Login
    const docRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'doctor@suvidhaaq.demo', password: 'Doctor@123' });
    expect(docRes.status).toBe(200);
    doctorToken = docRes.body.data.accessToken;

    // Patient Login
    const patientRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '9000000001', password: 'Patient@123' });
    expect(patientRes.status).toBe(200);
    patientToken = patientRes.body.data.accessToken;
  });

  describe('1. Authentication & Security', () => {
    it('rejects unauthenticated requests to protected endpoints with 401', async () => {
      const res = await request(app).get('/api/v1/admin/overview');
      expect(res.status).toBe(401);
    });

    it('rejects logins with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@suvidhaaq.demo', password: 'WrongPassword' });
      expect(res.status).toBe(401);
    });

    it('locks account for 15 minutes after 5 consecutive failed login attempts', async () => {
      // Create a test user to lock out
      const testEmail = `lockout-${Date.now()}@suvidhaaq.demo`;
      const testUser = await prisma.user.create({
        data: {
          hospitalId: hospital1Id,
          name: 'Lockout Test User',
          email: testEmail,
          passwordHash: '$2a$12$eXAMP1eHashValueNotUsedDirectlyHereSoFailedAttemptsAccumulate',
          role: Role.RECEPTIONIST,
        },
      });

      // Attempt 5 bad logins
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ email: testEmail, password: 'WrongPassword' });
        expect(res.status).toBe(401);
      }

      // 5th attempt should trigger lockout with 423
      const lockRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'WrongPassword' });

      expect(lockRes.status).toBe(423);
      expect(lockRes.body.error.message).toContain('locked');

      // Cleanup
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('rotates refresh token and returns new access token', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '9000000001', password: 'Patient@123' });
      const refreshToken = loginRes.body.data.refreshToken;

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).not.toBe(refreshToken); // rotated!
    });
  });

  describe('2. Role Permissions Matrix Enforcement', () => {
    it('Row 1: Catalog browsing is allowed for all roles (patient, receptionist, doctor, admin)', async () => {
      const pRes = await request(app)
        .get('/api/v1/catalog/hospitals')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(pRes.status).toBe(200);

      const rRes = await request(app)
        .get('/api/v1/catalog/hospitals')
        .set('Authorization', `Bearer ${receptionToken}`);
      expect(rRes.status).toBe(200);

      const dRes = await request(app)
        .get('/api/v1/catalog/hospitals')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(dRes.status).toBe(200);

      const aRes = await request(app)
        .get('/api/v1/catalog/hospitals')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(aRes.status).toBe(200);
    });

    it('Row 2: Booking own visit is allowed for patient only, forbidden for receptionist, doctor, admin (403)', async () => {
      const bookPayload = {
        hospitalId: hospital1Id,
        doctorId: doctor1Id,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        type: 'NEW',
        patientDetails: {
          name: 'Self Patient',
          age: 32,
          gender: 'Male',
          phone: '9000000001',
          isFamilyMember: false,
        },
      };

      // Patient can book
      const pRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(bookPayload);
      expect(pRes.status).toBe(201);
      expect(pRes.body.data.token.code).toBeDefined();

      // Receptionist forbidden (403)
      const rRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionToken}`)
        .send(bookPayload);
      expect(rRes.status).toBe(403);

      // Doctor forbidden (403)
      const dRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(bookPayload);
      expect(dRes.status).toBe(403);

      // Admin forbidden (403)
      const aRes = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bookPayload);
      expect(aRes.status).toBe(403);
    });

    it('Row 3 & 4: Register walk-in / emergency flag is allowed for receptionist & admin, forbidden for patient & doctor', async () => {
      const walkInPayload = {
        name: 'WalkIn Patient',
        age: 45,
        gender: 'Female',
        phone: '9876543210',
        doctorId: doctor1Id,
      };

      // Receptionist can register walk-in
      const rRes = await request(app)
        .post('/api/v1/queue/walk-in')
        .set('Authorization', `Bearer ${receptionToken}`)
        .send(walkInPayload);
      expect(rRes.status).toBe(201);
      expect(rRes.body.data.code).toContain('WLK-');

      // Admin can register walk-in
      const aRes = await request(app)
        .post('/api/v1/queue/walk-in')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...walkInPayload, name: 'Admin WalkIn' });
      expect(aRes.status).toBe(201);

      // Patient forbidden (403)
      const pRes = await request(app)
        .post('/api/v1/queue/walk-in')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(walkInPayload);
      expect(pRes.status).toBe(403);

      // Doctor forbidden (403)
      const dRes = await request(app)
        .post('/api/v1/queue/walk-in')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(walkInPayload);
      expect(dRes.status).toBe(403);
    });

    it('Row 5: Call next & consultation actions are allowed for doctor only (own queue), forbidden for receptionist, admin, patient', async () => {
      // Doctor calls next
      const dRes = await request(app)
        .post('/api/v1/doctor/call-next')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect([200, 400]).toContain(dRes.status);

      // Receptionist forbidden (403)
      const rRes = await request(app)
        .post('/api/v1/doctor/call-next')
        .set('Authorization', `Bearer ${receptionToken}`);
      expect(rRes.status).toBe(403);

      // Admin forbidden (403)
      const aRes = await request(app)
        .post('/api/v1/doctor/call-next')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(aRes.status).toBe(403);

      // Patient forbidden (403)
      const pRes = await request(app)
        .post('/api/v1/doctor/call-next')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(pRes.status).toBe(403);
    });

    it('Row 6 & 7: Manage staff, capacity quotas, audit logs are allowed for admin only', async () => {
      // Admin can view audit logs
      const aRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(aRes.status).toBe(200);

      // Doctor forbidden (403)
      const dRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(dRes.status).toBe(403);

      // Receptionist forbidden (403)
      const rRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${receptionToken}`);
      expect(rRes.status).toBe(403);

      // Patient forbidden (403)
      const pRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(pRes.status).toBe(403);
    });
  });

  describe('3. Concurrency-Safe Sequence & 50 Parallel Bookings', () => {
    it('fires 50 parallel bookings for one doctor and asserts 50 unique token codes', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Clean sequences for this doctor for today to test from fresh state
      await prisma.doctorDailySequence.deleteMany({
        where: { doctorId: doctor1Id, date: today },
      });

      const promises = Array.from({ length: 50 }, (_, i) => {
        return request(app)
          .post('/api/v1/patients')
          .set('Authorization', `Bearer ${patientToken}`)
          .send({
            hospitalId: hospital1Id,
            doctorId: doctor1Id,
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
            type: 'NEW',
            patientDetails: {
              name: `Parallel Patient ${i + 1}`,
              age: 25 + (i % 40),
              gender: i % 2 === 0 ? 'Male' : 'Female',
              phone: `911111${String(i).padStart(4, '0')}`,
              isFamilyMember: false,
            },
          });
      });

      const results = await Promise.all(promises);

      // Verify all 50 completed successfully
      results.forEach((res) => {
        expect(res.status).toBe(201);
      });

      const codes = results.map((r) => r.body.data.token.code);
      const sequences = results.map((r) => r.body.data.token.sequence);

      // Assert all 50 codes are strictly unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(50);

      // Assert all 50 sequences are consecutive unique numbers
      const uniqueSequences = new Set(sequences);
      expect(uniqueSequences.size).toBe(50);
      expect(Math.max(...sequences) - Math.min(...sequences) + 1).toBe(50);
    });
  });
});

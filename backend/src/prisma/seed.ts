import { PrismaClient, Role, AppointmentType, AppointmentStatus, TokenStatus, QueueTier } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

async function main() {
  console.log('🌱 Starting SuvidhaaQ database seeding...');

  // 1. Wipe existing data in reverse relation order
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.labReport.deleteMany({});
  await prisma.billingInvoice.deleteMany({});
  await prisma.consultation.deleteMany({});
  await prisma.queueToken.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorDailySequence.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.hospital.deleteMany({});

  console.log('🧹 Existing tables cleaned.');

  // Pre-hash demo passwords (12 rounds)
  const adminHash = await hashPassword('Admin@123');
  const receptionHash = await hashPassword('Reception@123');
  const doctorHash = await hashPassword('Doctor@123');
  const patientHash = await hashPassword('Patient@123');

  // 2. Create 2 Hospitals
  const hospitalA = await prisma.hospital.create({
    data: {
      name: 'SuvidhaaQ Metro Central Hospital',
      registrationNo: 'HOSP-DELHI-001',
      address: 'Plot 42, Health City, Connaught Place, New Delhi',
      phone: '+91-11-23456789',
      email: 'contact@delhi.suvidhaaq.org',
      workingHours: '08:00 - 20:00',
      settings: { capacitySplit: { new: 50, followUp: 20, walkIn: 30 } },
    },
  });

  const hospitalB = await prisma.hospital.create({
    data: {
      name: 'SuvidhaaQ Memorial Apex Hospital',
      registrationNo: 'HOSP-MUMBAI-002',
      address: '108 Marine Medical Road, Bandra, Mumbai',
      phone: '+91-22-98765432',
      email: 'contact@mumbai.suvidhaaq.org',
      workingHours: '08:00 - 20:00',
      settings: { capacitySplit: { new: 50, followUp: 20, walkIn: 30 } },
    },
  });

  console.log(`✅ Created 2 Hospitals: ${hospitalA.name}, ${hospitalB.name}`);

  const deptNames = [
    { name: 'Cardiology', location: 'Wing A, 2nd Floor' },
    { name: 'General Medicine', location: 'Wing B, Ground Floor' },
    { name: 'Orthopedics', location: 'Wing C, 1st Floor' },
    { name: 'Pediatrics', location: 'Wing D, 3rd Floor' },
  ];

  const doctorSpecializations: Record<string, string[]> = {
    Cardiology: ['Interventional Cardiologist', 'Heart Failure Specialist', 'Cardiac Electrophysiologist'],
    'General Medicine': ['Senior Physician', 'Consultant Physician', 'Internal Medicine Specialist'],
    Orthopedics: ['Joint Replacement Surgeon', 'Sports Injury Specialist', 'Spine Care Consultant'],
    Pediatrics: ['Senior Pediatrician', 'Child Care Specialist', 'Pediatric Pulmonologist'],
  };

  const doctorNames = [
    'Dr. Sarah Mitchell', 'Dr. Rajesh Sharma', 'Dr. Ananya Iyer',
    'Dr. Vikram Patel', 'Dr. Meera Nambiar', 'Dr. Arvind Swaminathan',
    'Dr. Priya Deshmukh', 'Dr. Kabir Oberoi', 'Dr. Sunita Rao',
    'Dr. Rohan Verma', 'Dr. Pooja Sen', 'Dr. Deepak Malhotra',
  ];

  let docNameIndex = 0;
  const createdDoctorsHospitalA: { id: string; name: string; deptId: string }[] = [];

  // Seed Hospital A & B departments and doctors
  for (const h of [hospitalA, hospitalB]) {
    const isHospitalA = h.id === hospitalA.id;

    // Admin user for hospital
    const adminUser = await prisma.user.create({
      data: {
        hospitalId: h.id,
        role: Role.ADMIN,
        name: isHospitalA ? 'System Administrator' : 'Apex Administrator',
        email: isHospitalA ? 'admin@suvidhaaq.demo' : `admin@${h.registrationNo.toLowerCase()}.demo`,
        passwordHash: adminHash,
        failedAttempts: 0,
      },
    });

    // 2 Receptionists for hospital
    await prisma.user.create({
      data: {
        hospitalId: h.id,
        role: Role.RECEPTIONIST,
        name: isHospitalA ? 'Front Desk Reception' : 'West Receptionist',
        email: isHospitalA ? 'reception@suvidhaaq.demo' : `reception1@${h.registrationNo.toLowerCase()}.demo`,
        passwordHash: receptionHash,
        failedAttempts: 0,
      },
    });

    await prisma.user.create({
      data: {
        hospitalId: h.id,
        role: Role.RECEPTIONIST,
        name: isHospitalA ? 'OPD Desk Coordinator' : 'Evening Receptionist',
        email: isHospitalA ? 'reception2@suvidhaaq.demo' : `reception2@${h.registrationNo.toLowerCase()}.demo`,
        passwordHash: receptionHash,
        failedAttempts: 0,
      },
    });

    // 4 Departments
    for (const d of deptNames) {
      const department = await prisma.department.create({
        data: {
          hospitalId: h.id,
          name: d.name,
          location: d.location,
          dailyCapacity: 60,
        },
      });

      // 3 Doctors per department
      for (let i = 0; i < 3; i++) {
        const dName = doctorNames[docNameIndex % doctorNames.length] + (isHospitalA ? '' : ' (Mumbai)');
        const specialization = doctorSpecializations[d.name][i];
        const isTargetDemoDoctor = isHospitalA && docNameIndex === 0;

        const docUser = await prisma.user.create({
          data: {
            hospitalId: h.id,
            role: Role.DOCTOR,
            name: dName,
            email: isTargetDemoDoctor ? 'doctor@suvidhaaq.demo' : `doc_${docNameIndex + 1}@${h.registrationNo.toLowerCase()}.demo`,
            passwordHash: doctorHash,
            failedAttempts: 0,
          },
        });

        const doctor = await prisma.doctor.create({
          data: {
            userId: docUser.id,
            hospitalId: h.id,
            departmentId: department.id,
            specialization,
            consultationMinutes: 15,
            room: `Room ${101 + (docNameIndex % 20)}`,
            available: true,
            sessionDelay: 0,
          },
        });

        if (isHospitalA) {
          createdDoctorsHospitalA.push({ id: doctor.id, name: dName, deptId: department.id });
        }
        docNameIndex++;
      }
    }
  }

  console.log(`✅ Created Departments & 24 Doctors across 2 Hospitals.`);

  // 3. Create 25 Patients
  const patientFirstNames = [
    'Ramesh', 'Sita', 'Amit', 'Neha', 'Vijay',
    'Sunita', 'Kiran', 'Suresh', 'Pooja', 'Manish',
    'Asha', 'Deepak', 'Geeta', 'Sanjay', 'Rekha',
    'Mohan', 'Kavita', 'Ashok', 'Anil', 'Meena',
    'Harish', 'Usha', 'Gaurav', 'Shanti', 'Raj'
  ];
  const patientLastNames = ['Kumar', 'Sharma', 'Patel', 'Verma', 'Singh', 'Gupta', 'Joshi', 'Yadav'];

  const primaryDemoPatientPhone = '9000000001';
  const primaryPatientUser = await prisma.user.create({
    data: {
      role: Role.PATIENT,
      name: 'Ramesh Kumar (Demo Patient)',
      phone: primaryDemoPatientPhone,
      email: 'patient@suvidhaaq.demo',
      passwordHash: patientHash,
      failedAttempts: 0,
    },
  });

  const createdPatients: { id: string; name: string; age: number; isSenior: boolean; phone: string }[] = [];

  for (let i = 0; i < 25; i++) {
    const fn = patientFirstNames[i];
    const ln = patientLastNames[i % patientLastNames.length];
    const fullName = i === 0 ? 'Ramesh Kumar' : `${fn} ${ln}`;
    const age = 20 + ((i * 7) % 55); // range ~20 to 74
    const isSenior = age >= 60;
    const phone = i === 0 ? primaryDemoPatientPhone : `98765${String(10000 + i).padStart(5, '0')}`;
    const uhid = `UHID-2026-${String(i + 1).padStart(4, '0')}`;

    const p = await prisma.patient.create({
      data: {
        hospitalId: hospitalA.id,
        bookedForUserId: i < 3 ? primaryPatientUser.id : null,
        name: fullName,
        age,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        phone,
        isSenior,
        uhid,
      },
    });

    createdPatients.push({ id: p.id, name: fullName, age, isSenior, phone });
  }

  console.log(`✅ Created 25 Patients (including senior citizens and family links).`);

  // 4. Create Today's Appointments and Queue Tokens in Mixed States for Hospital A
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const targetDoc = createdDoctorsHospitalA[0]; // Dr. Sarah Mitchell

  // Initialize DoctorDailySequence for Dr. Mitchell
  await prisma.doctorDailySequence.create({
    data: {
      hospitalId: hospitalA.id,
      doctorId: targetDoc.id,
      date: dateStr,
      currentSequence: 7,
    },
  });

  const tokenConfigs: {
    seq: number;
    code: string;
    type: AppointmentType;
    tier: QueueTier;
    status: TokenStatus;
    score: number;
    patientIdx: number;
  }[] = [
    { seq: 1, code: 'NEW-001', type: AppointmentType.NEW, tier: QueueTier.NEW_CONSULTATION, status: TokenStatus.COMPLETED, score: 70, patientIdx: 0 },
    { seq: 2, code: 'FUP-002', type: AppointmentType.FOLLOW_UP, tier: QueueTier.FOLLOW_UP, status: TokenStatus.COMPLETED, score: 65, patientIdx: 1 },
    { seq: 3, code: 'EMG-003', type: AppointmentType.NEW, tier: QueueTier.EMERGENCY, status: TokenStatus.IN_CONSULTATION, score: 100, patientIdx: 2 },
    { seq: 4, code: 'SNR-004', type: AppointmentType.NEW, tier: QueueTier.SENIOR, status: TokenStatus.CALLED, score: 85, patientIdx: 3 },
    { seq: 5, code: 'NEW-005', type: AppointmentType.NEW, tier: QueueTier.NEW_CONSULTATION, status: TokenStatus.ARRIVED, score: 75, patientIdx: 4 },
    { seq: 6, code: 'WLK-006', type: AppointmentType.WALK_IN, tier: QueueTier.WALK_IN, status: TokenStatus.ARRIVED, score: 45, patientIdx: 5 },
    { seq: 7, code: 'NEW-007', type: AppointmentType.NEW, tier: QueueTier.NEW_CONSULTATION, status: TokenStatus.PENDING, score: 50, patientIdx: 6 },
  ];

  for (const cfg of tokenConfigs) {
    const p = createdPatients[cfg.patientIdx];
    const apptTime = new Date(today);
    apptTime.setHours(9 + Math.floor(cfg.seq / 2), (cfg.seq % 2) * 30, 0, 0);

    const appt = await prisma.appointment.create({
      data: {
        hospitalId: hospitalA.id,
        patientId: p.id,
        doctorId: targetDoc.id,
        scheduledAt: apptTime,
        type: cfg.type,
        status:
          cfg.status === TokenStatus.COMPLETED
            ? AppointmentStatus.COMPLETED
            : cfg.status === TokenStatus.IN_CONSULTATION
            ? AppointmentStatus.IN_PROGRESS
            : AppointmentStatus.BOOKED,
      },
    });

    const token = await prisma.queueToken.create({
      data: {
        hospitalId: hospitalA.id,
        patientId: p.id,
        doctorId: targetDoc.id,
        appointmentId: appt.id,
        code: cfg.code,
        sequence: cfg.seq,
        tier: cfg.tier,
        score: cfg.score,
        status: cfg.status,
        position: cfg.status === TokenStatus.ARRIVED || cfg.status === TokenStatus.PENDING ? cfg.seq - 3 : 0,
        estimatedWaitMinutes: cfg.status === TokenStatus.ARRIVED ? (cfg.seq - 3) * 15 : 0,
        arrivedAt: cfg.status !== TokenStatus.PENDING ? new Date(today.getTime() - 40 * 60000) : null,
        calledAt: cfg.status === TokenStatus.CALLED || cfg.status === TokenStatus.IN_CONSULTATION || cfg.status === TokenStatus.COMPLETED ? new Date(today.getTime() - 20 * 60000) : null,
        startedAt: cfg.status === TokenStatus.IN_CONSULTATION || cfg.status === TokenStatus.COMPLETED ? new Date(today.getTime() - 15 * 60000) : null,
        completedAt: cfg.status === TokenStatus.COMPLETED ? new Date(today.getTime() - 2 * 60000) : null,
      },
    });

    if (cfg.status === TokenStatus.COMPLETED) {
      const consult = await prisma.consultation.create({
        data: {
          hospitalId: hospitalA.id,
          tokenId: token.id,
          doctorId: targetDoc.id,
          patientId: p.id,
          notes: 'Patient responded well to preliminary medication. BP stabilized at 120/80.',
          startedAt: new Date(today.getTime() - 25 * 60000),
          endedAt: new Date(today.getTime() - 10 * 60000),
          durationMinutes: 15,
        },
      });

      // Lab report for consultation
      await prisma.labReport.create({
        data: {
          hospitalId: hospitalA.id,
          patientId: p.id,
          consultationId: consult.id,
          reportType: 'Lipid Profile',
          reportName: 'Fast Lipid Panel',
          reportFileUrl: 'https://suvidhaaq.demo/reports/lipid_sample.pdf',
          status: 'Ready',
        },
      });
    }
  }

  console.log(`✅ Created today's appointments and tokens in mixed states.`);

  // 5. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      hospitalId: hospitalA.id,
      actorEmail: 'system@suvidhaaq.demo',
      role: 'SYSTEM',
      action: 'SYSTEM_SEED',
      entity: 'HOSPITAL',
      afterJson: { initialized: true, timestamp: new Date() },
    },
  });

  console.log('\n=============================================================');
  console.log('🎉 SuvidhaaQ Database Seed Completed Successfully!');
  console.log('=============================================================');
  console.log('🔑 DEMO CREDENTIALS:');
  console.log('  👨‍💼 Admin:        admin@suvidhaaq.demo      / Admin@123');
  console.log('  🏥 Receptionist: reception@suvidhaaq.demo  / Reception@123');
  console.log('  👨‍⚕️ Doctor:       doctor@suvidhaaq.demo     / Doctor@123');
  console.log('  👤 Patient:      Phone: 9000000001         / Patient@123');
  console.log('=============================================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

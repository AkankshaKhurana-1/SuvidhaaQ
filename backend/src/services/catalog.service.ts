import { prisma } from '../prisma/client';

export class CatalogService {
  public async getHospitals() {
    return prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        registrationNo: true,
        address: true,
        phone: true,
        email: true,
        workingHours: true,
        settings: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  public async getDepartmentsByHospital(hospitalId: string) {
    return prisma.department.findMany({
      where: { hospitalId },
      include: {
        _count: {
          select: { doctors: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  public async getDoctors(hospitalId?: string, departmentId?: string) {
    const where: any = {};
    if (hospitalId) where.hospitalId = hospitalId;
    if (departmentId) where.departmentId = departmentId;

    return prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        department: {
          select: { id: true, name: true, location: true },
        },
        hospital: {
          select: { id: true, name: true },
        },
      },
      orderBy: { specialization: 'asc' },
    });
  }
}

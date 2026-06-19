import { prisma } from '../prisma/client';

export interface UploadReportInput {
  patient_id: string;
  token: number;
  test_type: string;
  file: string;
}

export interface UploadReportOutput {
  success: boolean;
  report_id: string;
  report_url: string;
  uploaded_at: string;
}

export interface PatientReportOutput {
  report_id: string;
  test_type: string;
  report_url: string;
  uploaded_at: string;
  status: string;
}

export interface DoctorReportOutput {
  token_id: number;
  patient_name: string;
  reports: {
    report_id: string;
    test_type: string;
    report_url: string;
    uploaded_at: string;
  }[];
}

export class ReportService {
  /**
   * Uploads and registers a new patient medical report in the system.
   * 
   * Links: lab_reports (Report), patients, doctors using schema relations.
   */
  public async uploadReport(data: UploadReportInput): Promise<UploadReportOutput> {
    console.log(`[ReportService] Registering report "${data.test_type}" for patient: ${data.patient_id} with token ${data.token}`);

    const patientIdBig = BigInt(data.patient_id);
    const tokenIdBig = BigInt(data.token);

    // Verify patient exists
    const patientExists = await prisma.patients.findUnique({
      where: { patient_id: patientIdBig },
    });
    if (!patientExists) {
      throw new Error(`Patient ${data.patient_id} not found`);
    }

    // Load token details to get doctor_id and hospital_id
    const tokenExists = await prisma.queue_tokens.findUnique({
      where: { token_id: tokenIdBig },
    });
    if (!tokenExists) {
      throw new Error(`Queue token ${data.token} not found`);
    }

    const reportName = `${data.test_type} Report`;
    const reportTypeVal = data.test_type === 'blood' ? 'Blood Test' : (data.test_type === 'xray' ? 'X-Ray' : data.test_type);

    // Insert Report record into DB
    const report = await prisma.lab_reports.create({
      data: {
        patient_id: patientIdBig,
        doctor_id: tokenExists.doctor_id,
        hospital_id: tokenExists.hospital_id,
        report_type: reportTypeVal,
        report_name: reportName,
        report_file_url: data.file,
        uploaded_by: 'Patient',
        report_status: 'Uploaded',
        uploaded_at: new Date(),
      },
    });

    return {
      success: true,
      report_id: report.report_id.toString(),
      report_url: report.report_file_url,
      uploaded_at: report.uploaded_at.toISOString().replace('T', ' ').substring(0, 16),
    };
  }

  /**
   * Fetches all reports associated with a patient.
   */
  public async getReportsByPatient(patientId: string): Promise<PatientReportOutput[]> {
    console.log(`[ReportService] Fetching medical reports for patient: ${patientId}`);

    const reports = await prisma.lab_reports.findMany({
      where: { patient_id: BigInt(patientId) },
    });

    return reports.map((r) => ({
      report_id: r.report_id.toString(),
      test_type: r.report_type,
      report_url: r.report_file_url,
      uploaded_at: r.uploaded_at.toISOString().replace('T', ' ').substring(0, 16),
      status: r.report_status,
    }));
  }

  /**
   * Fetches patient reports for a doctor based on a specific queue token_id.
   */
  public async getReportsByDoctorToken(tokenId: number): Promise<DoctorReportOutput> {
    console.log(`[ReportService] Fetching patient reports for doctor review via token_id: ${tokenId}`);

    const tokenData = await prisma.queue_tokens.findUnique({
      where: { token_id: BigInt(tokenId) },
      include: {
        patients: true,
      },
    });

    if (!tokenData) {
      throw new Error(`Queue token ${tokenId} not found`);
    }

    // Query reports associated with that resolved patient ID
    const reports = await prisma.lab_reports.findMany({
      where: { patient_id: tokenData.patient_id },
    });

    return {
      token_id: tokenId,
      patient_name: tokenData.patients.full_name,
      reports: reports.map((r) => ({
        report_id: r.report_id.toString(),
        test_type: r.report_type,
        report_url: r.report_file_url,
        uploaded_at: r.uploaded_at.toISOString().replace('T', ' ').substring(0, 16),
      })),
    };
  }
}

import { prisma } from '../prisma/client';

export interface TokenPrintOutput {
  token_number: number;
  patient_name: string;
  type: 'new' | 'followup';
  estimated_wait: number;
  generated_at: string;
  doctor: string;
}

export class TokenService {
  /**
   * Retrieves token details for print receipt generation (API 26).
   * 
   * Reads: queue_tokens.token_code, queue_tokens.token_type, queue_tokens.estimated_wait_time
   */
  public async printTokenDetails(token_id: number): Promise<TokenPrintOutput> {
    console.log(`[TokenService] Fetching print receipt details for token: ${token_id}`);

    const tokenData = await prisma.queue_tokens.findUnique({
      where: { token_id: BigInt(token_id) },
      include: {
        patients: true,
        doctors: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!tokenData) {
      throw new Error(`Token ${token_id} not found`);
    }

    const doctorName = tokenData.doctors.users?.full_name || `Dr. ${tokenData.doctor_id}`;
    const tokenTypeVal = tokenData.token_type === 'Walk-in' ? 'new' : 'followup';

    return {
      token_number: Number(tokenData.token_id),
      patient_name: tokenData.patients.full_name,
      type: tokenTypeVal,
      estimated_wait: tokenData.estimated_wait_time,
      generated_at: tokenData.check_in_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doctor: doctorName,
    };
  }
}

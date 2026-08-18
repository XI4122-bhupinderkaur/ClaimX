import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FraudService {
  constructor(private prisma: PrismaService) {}

  private mapAssessment(record: any) {
    return {
      claimId: record.claimId,
      fraudScore: record.fraudScore,
      riskLevel: record.riskLevel,
      riskFactors: record.riskFactors,
      status: record.status,
    };
  }

  private async ensureClaimOwned(claimId: string, userId: string) {
    const claim = await this.prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.customerId !== userId) throw new ForbiddenException('Not authorized for this claim');
    return claim;
  }

  async getByClaimId(claimId: string, userId: string) {
    await this.ensureClaimOwned(claimId, userId);
    const assessment = await this.prisma.fraudAssessment.findUnique({ where: { claimId } });
    if (!assessment) throw new NotFoundException('Fraud assessment not found');
    return this.mapAssessment(assessment);
  }

  async getById(id: string, userId: string) {
    const assessment = await this.prisma.fraudAssessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException('Fraud assessment not found');

    // verify claim ownership
    const claim = await this.prisma.claim.findUnique({ where: { id: assessment.claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.customerId !== userId) throw new ForbiddenException('Not authorized for this fraud assessment');

    return this.mapAssessment(assessment);
  }
}

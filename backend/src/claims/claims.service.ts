import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClaimsService {
  constructor(private prisma: PrismaService) {}

  private mapClaim(record: any) {
    return {
      id: record.id,
      policyId: record.policyId,
      customerId: record.customerId,
      claimNumber: record.claimNumber,
      status: record.status,
      incidentDate: record.incidentDate.toISOString(),
      description: record.description,
      claimAmount: Number(record.claimAmount),
      approvedAmount: Number(record.approvedAmount),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async listClaims(currentUserId?: string) {
    const where = currentUserId ? { customerId: currentUserId } : undefined;
    const records = await this.prisma.claim.findMany({ where });
    return records.map((r) => this.mapClaim(r));
  }

  async getClaimById(id: string, currentUserId?: string) {
    const record = await this.prisma.claim.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Claim not found');
    if (currentUserId && record.customerId !== currentUserId) {
      throw new ForbiddenException('Not authorized to access this claim');
    }
    return this.mapClaim(record);
  }

  async createClaim(payload: CreateClaimDto, currentUserId?: string) {
    if (currentUserId && payload.customerId !== currentUserId) {
      throw new ForbiddenException('Cannot create claim for another user');
    }

    const data: any = {
      policyId: payload.policyId,
      customerId: payload.customerId,
      claimNumber: payload.claimNumber,
      status: payload.status as any,
      incidentDate: new Date(payload.incidentDate),
      description: payload.description,
      claimAmount: payload.claimAmount,
      approvedAmount: payload.approvedAmount ?? 0,
    };

    const record = await this.prisma.claim.create({ data });
    return this.mapClaim(record);
  }

  async updateClaim(id: string, payload: UpdateClaimDto, currentUserId?: string) {
    const existing = await this.prisma.claim.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Claim not found');
    if (currentUserId && existing.customerId !== currentUserId) {
      throw new ForbiddenException('Not authorized to modify this claim');
    }

    const data: any = {};
    const p: any = payload as any;
    if (p.policyId !== undefined) data.policyId = p.policyId;
    if (p.customerId !== undefined) data.customerId = p.customerId;
    if (p.claimNumber !== undefined) data.claimNumber = p.claimNumber;
    if (p.status !== undefined) data.status = p.status;
    if (p.incidentDate !== undefined) data.incidentDate = new Date(p.incidentDate);
    if (p.description !== undefined) data.description = p.description;
    if (p.claimAmount !== undefined) data.claimAmount = p.claimAmount;
    if (p.approvedAmount !== undefined) data.approvedAmount = p.approvedAmount;

    const record = await this.prisma.claim.update({ where: { id }, data });
    return this.mapClaim(record);
  }
}

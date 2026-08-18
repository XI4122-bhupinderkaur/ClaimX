import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private mapPayment(record: any) {
    return {
      id: record.id,
      claimId: record.claimId,
      amount: Number(record.amount),
      status: record.status,
      transactionId: record.transactionId,
      createdAt: record.createdAt.toISOString(),
    };
  }

  async listPayments(userId: string) {
    const records = await this.prisma.payment.findMany({ where: { claim: { customerId: userId } } });
    return records.map((r) => this.mapPayment(r));
  }

  async getPaymentById(id: string, userId: string) {
    const record = await this.prisma.payment.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Payment not found');

    const claim = await this.prisma.claim.findUnique({ where: { id: record.claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.customerId !== userId) throw new ForbiddenException('Not authorized to access this payment');

    return this.mapPayment(record);
  }

  async createPayment(dto: CreatePaymentDto, userId: string) {
    const claim = await this.prisma.claim.findUnique({ where: { id: dto.claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.customerId !== userId) throw new ForbiddenException('Not authorized to create a payment for this claim');

    const data: any = {
      claimId: dto.claimId,
      // pass amount as string so Prisma persists it as Decimal in DB
      amount: dto.amount.toString(),
      status: dto.status,
      transactionId: dto.transactionId,
    };

    const record = await this.prisma.payment.create({ data });
    return this.mapPayment(record);
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  private mapDocument(record: any) {
    return {
      id: record.id,
      claimId: record.claimId,
      name: record.name,
      type: record.type,
      url: record.url,
      uploadedAt: record.uploadedAt.toISOString(),
      status: record.status,
    };
  }

  async ensureClaimOwned(claimId: string, userId: string) {
    const claim = await this.prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.customerId !== userId) throw new ForbiddenException('Not authorized for this claim');
    return claim;
  }

  async listDocuments(claimId: string, userId: string) {
    await this.ensureClaimOwned(claimId, userId);
    const docs = await this.prisma.document.findMany({ where: { claimId } });
    return docs.map((d) => this.mapDocument(d));
  }

  async getDocumentById(documentId: string, userId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    const claim = await this.prisma.claim.findUnique({ where: { id: doc.claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.customerId !== userId) throw new ForbiddenException('Not authorized for this document');
    return this.mapDocument(doc);
  }

  async createDocument(claimId: string, dto: CreateDocumentDto, userId: string) {
    await this.ensureClaimOwned(claimId, userId);

    const data: any = {
      claimId,
      name: dto.name,
      type: dto.type,
      url: '',
      status: 'PENDING',
    };

    const record = await this.prisma.document.create({ data });
    return this.mapDocument(record);
  }

  async deleteDocument(documentId: string, userId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    const claim = await this.prisma.claim.findUnique({ where: { id: doc.claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.customerId !== userId) throw new ForbiddenException('Not authorized to delete this document');
    await this.prisma.document.delete({ where: { id: documentId } });
    return;
  }
}

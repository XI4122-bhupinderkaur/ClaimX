import { Controller, Get, Param, Post, Body, Delete, UseGuards, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDocumentDto } from './dto/create-document.dto';

@Controller()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DocumentsController {
  constructor(private service: DocumentsService) {}

  @Get('/claims/:claimId/documents')
  async list(@Param('claimId') claimId: string, @Req() req: any) {
    return this.service.listDocuments(claimId, req.user.id);
  }

  @Get('/documents/:id')
  async get(@Param('id') id: string, @Req() req: any) {
    return this.service.getDocumentById(id, req.user.id);
  }

  @Post('/claims/:claimId/documents')
  async create(@Param('claimId') claimId: string, @Body() dto: CreateDocumentDto, @Req() req: any) {
    return this.service.createDocument(claimId, dto, req.user.id);
  }

  @Delete('/documents/:id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteDocument(id, req.user.id);
  }
}

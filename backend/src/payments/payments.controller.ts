import { Controller, Get, Post, Body, Param, UseGuards, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Get('/payments')
  async list(@Req() req: any) {
    return this.service.listPayments(req.user.id);
  }

  @Get('/payments/:id')
  async get(@Param('id') id: string, @Req() req: any) {
    return this.service.getPaymentById(id, req.user.id);
  }

  @Post('/payments')
  async create(@Body() dto: CreatePaymentDto, @Req() req: any) {
    return this.service.createPayment(dto, req.user.id);
  }
}

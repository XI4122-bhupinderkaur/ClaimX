import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FraudService } from './fraud.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class FraudController {
  constructor(private service: FraudService) {}

  @Get('/claims/:claimId/fraud')
  async getByClaim(@Param('claimId') claimId: string, @Req() req: any) {
    return this.service.getByClaimId(claimId, req.user.id);
  }

  @Get('/fraud/:id')
  async getById(@Param('id') id: string, @Req() req: any) {
    return this.service.getById(id, req.user.id);
  }
}

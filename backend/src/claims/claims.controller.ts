import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('claims')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(JwtAuthGuard)
export class ClaimsController {
  constructor(private service: ClaimsService) {}

  @Get()
  async list(@CurrentUser() currentUser?: any) {
    return this.service.listClaims(currentUser?.id);
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() currentUser?: any) {
    return this.service.getClaimById(id, currentUser?.id);
  }

  @Post()
  async create(@Body() dto: CreateClaimDto, @CurrentUser() currentUser?: any) {
    return this.service.createClaim(dto, currentUser?.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClaimDto,
    @CurrentUser() currentUser?: any,
  ) {
    return this.service.updateClaim(id, dto, currentUser?.id);
  }
}

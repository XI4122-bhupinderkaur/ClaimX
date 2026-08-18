import { IsOptional, IsString, IsISO8601, IsNumber, IsEnum } from 'class-validator';
import { ClaimStatus } from '../../../generated/prisma/enums';

export class UpdateClaimDto {
  @IsOptional()
  @IsString()
  policyId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  claimNumber?: string;

  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @IsOptional()
  @IsISO8601()
  incidentDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  claimAmount?: number;

  @IsOptional()
  @IsNumber()
  approvedAmount?: number;
}

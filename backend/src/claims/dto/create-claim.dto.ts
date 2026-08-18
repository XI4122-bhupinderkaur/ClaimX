import { IsString, IsNotEmpty, IsEnum, IsISO8601, IsNumber, IsOptional } from 'class-validator';
import { ClaimStatus } from '../../../generated/prisma/enums';

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty()
  policyId!: string;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  claimNumber!: string;

  @IsEnum(ClaimStatus)
  status!: ClaimStatus;

  @IsISO8601()
  incidentDate!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  claimAmount!: number;

  @IsOptional()
  @IsNumber()
  approvedAmount?: number;
}

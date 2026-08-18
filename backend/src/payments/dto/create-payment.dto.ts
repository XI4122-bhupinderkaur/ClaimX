import { IsString, IsNotEmpty, IsNumber, Min, IsEnum } from 'class-validator';
import { PaymentStatus } from '../../../generated/prisma/enums';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  claimId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsString()
  @IsNotEmpty()
  transactionId!: string;
}

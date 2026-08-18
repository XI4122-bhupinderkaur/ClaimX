import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { DocumentType } from '../../../generated/prisma/enums';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(DocumentType)
  type!: DocumentType;
}

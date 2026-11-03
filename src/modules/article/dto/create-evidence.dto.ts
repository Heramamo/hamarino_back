import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EvidenceTypeDto {
  DIRECT_WITNESS = 'DIRECT_WITNESS',
  DOCUMENT = 'DOCUMENT',
  OFFICIAL_SOURCE = 'OFFICIAL_SOURCE',
  LINK = 'LINK',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

export class CreateEvidenceDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  articleId!: number;

  @ApiProperty({ enum: EvidenceTypeDto })
  @IsEnum(EvidenceTypeDto)
  type!: EvidenceTypeDto;

  @ApiPropertyOptional({ minLength: 1, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  url?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  file?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;
}

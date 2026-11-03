import { IsEnum, IsInt, IsString, Length, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VerificationVerdict {
  CONFIRMED = 'CONFIRMED',
  DISPUTED = 'DISPUTED',
}

export class VerifyArticleDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  articleId!: number;

  @ApiProperty({ enum: VerificationVerdict })
  @IsEnum(VerificationVerdict)
  verdict!: VerificationVerdict;

  @ApiProperty({ minLength: 10, maxLength: 2000 })
  @IsString()
  @Length(10, 2000)
  justification!: string;
}

import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ArticleCommentStance {
  FOR = 'FOR',
  AGAINST = 'AGAINST',
}

export class CreateCommentDto {
  @ApiProperty({ enum: ArticleCommentStance, example: ArticleCommentStance.FOR })
  @IsEnum(ArticleCommentStance)
  stance!: ArticleCommentStance;

  @ApiProperty({ minLength: 3, maxLength: 2000 })
  @IsString()
  @Length(3, 2000)
  content!: string;

  @ApiProperty({ minLength: 10, maxLength: 4000 })
  @IsString()
  @Length(10, 4000)
  justification!: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  articleId?: number;
}

import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum ArticleRelationType {
  SUPPORTS = 'SUPPORTS',
  CONTRADICTS = 'CONTRADICTS',
}

export class CreateArticleDto {
  @ApiProperty({ minLength: 3, maxLength: 255 })
  @IsString()
  @Length(3, 255)
  title!: string;

  @ApiProperty({ minLength: 10, maxLength: 10000 })
  @IsString()
  @Length(10, 10000)
  content!: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  location?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ description: 'URL de la couverture de l’article' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  coverImageUrl?: string;

  @ApiPropertyOptional({ type: [String], description: 'URLs des images liées à l’article' })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  topicId!: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  parentArticleId?: number;

  @ApiPropertyOptional({ enum: ArticleRelationType })
  @IsOptional()
  @IsEnum(ArticleRelationType)
  relationType?: ArticleRelationType;
}

import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {

  @IsString()
  @MinLength(2)
  @ApiProperty({example:"Maitre Heramamo", description:"Nom complet"})
  name!: string;
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @ApiProperty({example:"heramamo@gmail.com", description:"Email"})
  email!: string;

  @ApiProperty({example:"motdepasse123", description:"Mot de passe"})
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  mediaId?: number;
}

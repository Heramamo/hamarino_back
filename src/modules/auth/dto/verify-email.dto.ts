import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyEmailDto {
@ApiProperty({example:"heramamo@gmail.com"})
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;
@ApiProperty({example:154})
  @Matches(/^\d{6}$/, { message: 'Le code doit contenir 6 chiffres' })
  code!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @MinLength(2)
  @ApiProperty({ example: 'Admin Hamarino', description: 'Nom complet de l’administrateur' })
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @ApiProperty({ example: 'admin@astap.fr', description: 'Email admin' })
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @ApiProperty({ example: 'motdepasse123', description: 'Mot de passe de l’administrateur' })
  password!: string;
}

import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

enum UserStatus {
  PENDING = 'PENDING',
  REFUSED = 'REFUSED',
  VALIDATE = 'VALIDATE',
}

export class ValidateUserDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 1, description: 'ID de l’utilisateur' })
  id_user!: number;

  @IsEnum(UserStatus, { message: 'status doit valoir PENDING, REFUSED ou VALIDATE' })
  @ApiProperty({ example: 'VALIDATE', enum: UserStatus, description: 'Nouveau statut du compte' })
  status!: UserStatus;
}

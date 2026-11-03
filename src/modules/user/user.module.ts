import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UserController } from './user.controller';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  controllers: [UserController],
  providers: [UsersService, CloudinaryService],
})
export class UserModule {}

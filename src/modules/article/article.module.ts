import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AiornotService } from './aiornot.service.js';

@Module({
  controllers: [ArticleController],
  providers: [ArticleService, CloudinaryService, AiornotService],
})
export class ArticleModule {}

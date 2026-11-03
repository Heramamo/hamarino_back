import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { NewsWatchService } from './news-watch.service.js';

@Controller('watch')
export class NewsWatchController {
  constructor(private readonly newsWatch: NewsWatchService) {}

  @Get('articles')
  @ApiOperation({ summary: 'Consulter les dernières actualités de la veille Madagascar' })
  listLatest() {
    return this.newsWatch.listPublicLatest();
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Relancer immédiatement la recherche des actualités Madagascar' })
  refreshLatest() {
    return this.newsWatch.syncLatest();
  }
}

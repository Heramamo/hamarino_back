import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFiles,
  UploadedFile as UploadedFileParam,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt.guard.js';
import { AccountValidatedGuard } from '../../guards/account-validated.guard.js';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { ListArticlesQueryDto } from './dto/list-articles.dto';
import { VerifyArticleDto } from './dto/verify-article.dto';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import type { AppRequestUser } from '../../common/request-user.js';
import type { UploadedFile } from '../../common/uploads.js';
import { assertAllowedImage } from '../../common/uploads.js';
import { AiornotService } from './aiornot.service.js';

interface UploadedArticleFiles {
  coverImage?: UploadedFile[];
  images?: UploadedFile[];
}

@Controller('article')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly aiornotService: AiornotService,
  ) {}

  @Post('aiornot/test')
  @ApiOperation({ summary: 'Tester AI or Not avec une image (aucun rapport enregistré)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async testAiornot(@UploadedFileParam() file?: UploadedFile) {
    if (!file) throw new BadRequestException('Le fichier image est requis');
    assertAllowedImage(file);
    return this.aiornotService.analyze(file);
  }

  @UseGuards(AccountValidatedGuard)
  @Post()
  @ApiOperation({ summary: 'Publier un article avec images facultatives (compte validé requis)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Article à publier, avec option de fichiers image',
    schema: {
      type: 'object',
      required: ['title', 'content', 'topicId'],
      properties: {
        title: { type: 'string', example: 'Une information très importante' },
        content: { type: 'string', example: 'Voici le détail de l’information...' },
        topicId: { type: 'integer', example: 1 },
        location: { type: 'string', example: 'Paris', nullable: true },
        eventDate: { type: 'string', format: 'date-time', nullable: true },
        coverImageUrl: { type: 'string', example: 'https://example.com/cover.jpg', nullable: true },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Images de galerie de l’article',
        },
        coverImage: {
          type: 'string',
          format: 'binary',
          description: 'Image de couverture de l’article',
        },
        parentArticleId: { type: 'integer', nullable: true },
        relationType: { type: 'string', enum: ['SUPPORTS', 'CONTRADICTS'], nullable: true },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'coverImage', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ],
      { limits: { fileSize: 5 * 1024 * 1024 } },
    ),
  )
  create(
    @Req() req: { user: AppRequestUser },
    @Body() dto: CreateArticleDto,
    @UploadedFiles() files: UploadedArticleFiles,
  ) {
    return this.articleService.createArticle(req.user.sub, dto, files);
  }

  @UseGuards(AccountValidatedGuard)
  @Post(':id/comment')
  @ApiOperation({ summary: 'Ajouter un commentaire sur un article avec un avis pour/contre et justification' })
  addComment(
    @Req() req: { user: AppRequestUser },
    @Param('id', ParseIntPipe) articleId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.articleService.addComment(req.user.sub, articleId, dto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Lister les commentaires d’un article' })
  getComments(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.getCommentsByArticle(id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les articles (paginé)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: ListArticlesQueryDto) {
    return this.articleService.listArticles(query);
  }

  @Get('topics')
  @ApiOperation({ summary: 'Lister les sujets disponibles pour les articles' })
  getTopics() {
    return this.articleService.getTopics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un article avec ses vérifications et preuves' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.getArticleById(id);
  }

  @UseGuards(AccountValidatedGuard)
  @Post('verify')
  @ApiOperation({ summary: 'Enregistrer une vérification (compte validé requis)' })
  verify(@Req() req: { user: AppRequestUser }, @Body() dto: VerifyArticleDto) {
    return this.articleService.verifyArticle(req.user.sub, dto);
  }

  @UseGuards(AccountValidatedGuard)
  @Post('evidence')
  @ApiOperation({ summary: 'Ajouter une preuve (compte validé requis)' })
  addEvidence(@Req() req: { user: AppRequestUser }, @Body() dto: CreateEvidenceDto) {
    return this.articleService.addEvidence(req.user.sub, dto);
  }

  @Get(':id/verifications')
  @ApiOperation({ summary: 'Lister les vérifications d’un article' })
  getVerifications(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.getArticleVerifications(id);
  }
}

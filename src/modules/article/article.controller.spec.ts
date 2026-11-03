import { Test, TestingModule } from '@nestjs/testing';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { PrismaService } from '../../prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AiornotService } from './aiornot.service';
import { prismaMock, cloudinaryMock } from '../../../test/mocks';

describe('ArticleController', () => {
  let controller: ArticleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        ArticleService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CloudinaryService, useValue: cloudinaryMock },
        { provide: AiornotService, useValue: { analyze: vi.fn() } },
      ],
    }).compile();

    controller = module.get<ArticleController>(ArticleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { PrismaService } from '../../prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AiornotService } from './aiornot.service';
import { prismaMock, cloudinaryMock } from '../../../test/mocks';

describe('ArticleService', () => {
  let service: ArticleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CloudinaryService, useValue: cloudinaryMock },
        { provide: AiornotService, useValue: { analyze: vi.fn() } },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

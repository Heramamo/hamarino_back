import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import { UsersService } from './user.service';
import { PrismaService } from '../../prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import type { AppRequestUser } from '../../common/request-user.js';

const personalUser = (id: number): AppRequestUser => ({
  sub: id,
  email: `user${id}@example.com`,
  role: 'PERSONAL',
  status: 'VALIDATE',
});

const adminUser: AppRequestUser = {
  sub: 99,
  email: 'admin@example.com',
  role: 'ADMIN',
  status: 'VALIDATE',
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: { findUnique: ReturnType<typeof vi.fn> };
  };
  const cloudinary = { getSignedUrl: (id: string) => `signed:${id}` };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          name: 'Journaliste',
          email: 'j@example.com',
          role: 'PERSONAL',
          status: 'PENDING',
          mediaId: null,
          proofFrontUrl: 'front-id',
          proofBackUrl: 'back-id',
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('autorise le propriétaire à voir ses pièces', async () => {
    const result = await service.getProofUrls(personalUser(1), 1);
    expect(result.proofFrontUrl).toBe('signed:front-id');
    expect(result.proofBackUrl).toBe('signed:back-id');
  });

  it('autorise un administrateur à voir les pièces', async () => {
    const result = await service.getProofUrls(adminUser, 1);
    expect(result.proofFrontUrl).toBe('signed:front-id');
  });

  it('refuse un autre utilisateur non admin', async () => {
    await expect(service.getProofUrls(personalUser(2), 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('renvoie 404 si l’utilisateur est introuvable', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.getProofUrls(adminUser, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

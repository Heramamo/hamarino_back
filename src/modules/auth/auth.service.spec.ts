import { Test, TestingModule } from '@nestjs/testing';
import {
  HttpException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../user/user.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';

const buildUser = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Journaliste',
  email: 'j@example.com',
  passwordHash: bcrypt.hashSync('motdepasse123', 4),
  role: 'PERSONAL',
  status: 'VALIDATE',
  emailVerifiedAt: new Date(),
  emailCodeHash: null,
  emailCodeExpiresAt: null,
  emailCodeSentAt: null,
  emailCodeAttempts: 0,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let users: { findByEmail: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let jwt: { signAsync: ReturnType<typeof vi.fn> };
  let mail: { sendVerificationCode: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    users = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    jwt = { signAsync: vi.fn().mockResolvedValue('token') };
    mail = { sendVerificationCode: vi.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: CloudinaryService, useValue: {} },
        { provide: JwtService, useValue: jwt },
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('renvoie le même message pour un email inconnu', async () => {
      users.findByEmail.mockResolvedValue(null);
      const error = await service
        .login({ email: 'x@example.com', password: 'whatever1' })
        .catch((e) => e);
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe('Identifiants invalides');
    });

    it('renvoie le même message pour un mauvais mot de passe', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      const error = await service
        .login({ email: 'j@example.com', password: 'mauvais-mot-de-passe' })
        .catch((e) => e);
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe('Identifiants invalides');
    });

    it('refuse un compte non vérifié', async () => {
      users.findByEmail.mockResolvedValue(buildUser({ emailVerifiedAt: null }));
      await expect(
        service.login({ email: 'j@example.com', password: 'motdepasse123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refuse un compte refusé', async () => {
      users.findByEmail.mockResolvedValue(buildUser({ status: 'REFUSED' }));
      await expect(
        service.login({ email: 'j@example.com', password: 'motdepasse123' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('délivre un token pour un compte valide', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      const result = await service.login({
        email: 'j@example.com',
        password: 'motdepasse123',
      });
      expect(result.access_token).toBe('token');
    });
  });

  describe('verifyEmail', () => {
    it('bloque après 5 tentatives et invalide le code', async () => {
      prisma.user.findUnique.mockResolvedValue(
        buildUser({
          emailVerifiedAt: null,
          emailCodeHash: 'ab'.repeat(32),
          emailCodeExpiresAt: new Date(Date.now() + 60_000),
          emailCodeAttempts: 5,
        }),
      );

      await expect(service.verifyEmail('j@example.com', '123456')).rejects.toMatchObject({
        message: 'Trop de tentatives incorrectes. Demandez un nouveau code.',
      });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ emailCodeHash: null }),
        }),
      );
    });
  });

  describe('resendVerification', () => {
    it('impose un cooldown d’une minute', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'j@example.com',
        name: 'Journaliste',
        emailVerifiedAt: null,
        emailCodeSentAt: new Date(),
      });

      await expect(service.resendVerification('j@example.com')).rejects.toBeInstanceOf(
        HttpException,
      );
      expect(mail.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('ne révèle pas si un compte existe (anti-énumération)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.resendVerification('inconnu@example.com');
      expect(result.message).toMatch(/nouveau code/);
      expect(mail.sendVerificationCode).not.toHaveBeenCalled();
    });
  });
});

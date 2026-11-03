import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UsersService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../prisma.service';
import { assertAllowedImage, type UploadedFile } from '../../common/uploads.js';

export interface UploadedProofs {
  front?: UploadedFile[];
  back?: UploadedFile[];
}

const CODE_TTL_MS = 10 * 60 * 1000;   // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute entre deux envois
const MAX_ATTEMPTS = 5;

const hashCode = (userId: number, code: string) =>
  createHash('sha256').update(`${userId}:${code}`).digest('hex');

const INVALID_CREDENTIALS = 'Identifiants invalides';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly users: UsersService,
    private readonly cloudinary: CloudinaryService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) { }

  async register(dto: RegisterDto, files: UploadedProofs) {
    const front = files?.front?.[0];
    const back = files?.back?.[0];

    if (!front || !back) {
      throw new BadRequestException('Le recto et le verso sont obligatoires');
    }

    assertAllowedImage(front);
    assertAllowedImage(back);

    if (dto.mediaId !== undefined && dto.mediaId !== null) {
      const mediaExists = await this.prisma.media.findUnique({
        where: { id: dto.mediaId },
        select: { id: true },
      });

      if (!mediaExists) {
        throw new BadRequestException('Le média sélectionné est introuvable');
      }
    }

    const [frontRes, backRes] = await Promise.all([
      this.cloudinary.uploadPrivate(front),
      this.cloudinary.uploadPrivate(back),
    ]);

    try {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = await this.users.create({
        name: dto.name,
        email: dto.email,
        passwordHash,
        mediaId: dto.mediaId ?? undefined,
        proofFrontUrl: frontRes.public_id,
        proofBackUrl: backRes.public_id,
      });
      await this.sendVerification(user);
      return {
        message: 'Compte créé. Un code à 6 chiffres vous a été envoyé par email.',
      };
    } catch (error) {
      await Promise.allSettled([
        this.cloudinary.delete(frontRes.public_id),
        this.cloudinary.delete(backRes.public_id),
      ]);
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);

    // Même message pour "utilisateur inconnu" et "mauvais mot de passe"
    // afin de ne pas permettre l'énumération des emails.
    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Email non vérifié. Consultez votre boîte mail pour le code de vérification.',
      );
    }

    if (user.status === 'REFUSED') {
      throw new ForbiddenException('Votre compte a été refusé. Contactez un administrateur.');
    }

    const payload = { sub: user.id, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  private async sendVerification(user: { id: number; email: string; name: string }) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailCodeHash: hashCode(user.id, code),
        emailCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
        emailCodeSentAt: new Date(),
        emailCodeAttempts: 0,
      },
    });

    await this.mail.sendVerificationCode(user.email, user.name, code);
  }

  async verifyEmail(email: string, code: string) {
    const invalid = new BadRequestException('Code invalide ou expiré');
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (
      !user ||
      user.emailVerifiedAt ||
      !user.emailCodeHash ||
      !user.emailCodeExpiresAt ||
      user.emailCodeExpiresAt < new Date()
    ) {
      throw invalid;
    }

    if (user.emailCodeAttempts >= MAX_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailCodeHash: null,
          emailCodeExpiresAt: null,
          emailCodeSentAt: null,
        },
      });
      throw new BadRequestException(
        'Trop de tentatives incorrectes. Demandez un nouveau code.',
      );
    }

    const expected = Buffer.from(user.emailCodeHash, 'hex');
    const received = Buffer.from(hashCode(user.id, code), 'hex');
    const ok =
      expected.length === received.length && timingSafeEqual(expected, received);

    if (!ok) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailCodeAttempts: { increment: 1 } },
      });
      throw invalid;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailCodeHash: null,
        emailCodeExpiresAt: null,
        emailCodeSentAt: null,
        emailCodeAttempts: 0,
        verified: true,
      },
    });

    const payload = { sub: user.id, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      message: "Email vérifié. Votre compte attend la validation d'un administrateur.",
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerifiedAt: true,
        emailCodeSentAt: true,
      },
    });
    const genericMessage =
      "Si un compte non vérifié correspond à cette adresse, un nouveau code vient d'être envoyé.";

    if (!user || user.emailVerifiedAt) {
      return { message: genericMessage };
    }

    if (
      user.emailCodeSentAt &&
      Date.now() - user.emailCodeSentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      const waitSeconds = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - user.emailCodeSentAt.getTime())) / 1000,
      );
      throw new HttpException(
        `Veuillez patienter ${waitSeconds}s avant de demander un nouveau code.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.sendVerification(user);
    return { message: genericMessage };
  }
}

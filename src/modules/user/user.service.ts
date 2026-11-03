import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import type { AppRequestUser } from '../../common/request-user.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async getCurrentUser(requester: AppRequestUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: requester.sub },
      select: { id: true, name: true, email: true, role: true, status: true, media: { select: { name: true, city: true } } },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    mediaId?: number;
    proofFrontUrl: string;
    proofBackUrl: string;
  }) {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        mediaId: data.mediaId,
        proofFrontUrl: data.proofFrontUrl,
        proofBackUrl: data.proofBackUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        mediaId: true,
      },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        mediaId: true,
        proofFrontUrl: true,
        proofBackUrl: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      proofFrontUrl: user.proofFrontUrl
        ? this.cloudinary.getSignedUrl(user.proofFrontUrl)
        : null,
      proofBackUrl: user.proofBackUrl
        ? this.cloudinary.getSignedUrl(user.proofBackUrl)
        : null,
    };
  }

  /**
   * Les pièces d'identité ne sont accessibles qu'à leur propriétaire
   * ou aux administrateurs.
   */
  async getProofUrls(requester: AppRequestUser, id: number) {
    if (requester.role !== 'ADMIN' && requester.sub !== id) {
      throw new ForbiddenException(
        'Vous ne pouvez consulter que vos propres pièces d’identité',
      );
    }

    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return {
      id: user.id,
      proofFrontUrl: user.proofFrontUrl,
      proofBackUrl: user.proofBackUrl,
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

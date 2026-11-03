import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ValidateUserDto } from './dto/validateUser.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const adminSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  verified: true,
} as const;

const validateSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  verified: true,
  reputation: true,
  registeredAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async createAdmin(dto: CreateAdminDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const admin = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: 'ADMIN',
        status: 'VALIDATE',
        verified: true,
        reputation: 0,
        emailVerifiedAt: new Date(),
      },
      select: adminSelect,
    });

    return {
      message: 'Compte administrateur créé avec succès',
      admin,
    };
  }

  async listPendingUsers() {
    return this.prisma.user.findMany({
      where: {
        status: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        verified: true,
        registeredAt: true,
        media: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });
  }

  async getUserForReview(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        verified: true,
        reputation: true,
        registeredAt: true,
        proofFrontUrl: true,
        proofBackUrl: true,
        media: {
          select: {
            id: true,
            name: true,
            mediaType: true,
            city: true,
            website: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return {
      ...user,
      proofFrontUrl: user.proofFrontUrl ? this.cloudinary.getSignedUrl(user.proofFrontUrl) : null,
      proofBackUrl: user.proofBackUrl ? this.cloudinary.getSignedUrl(user.proofBackUrl) : null,
    };
  }

  async validateUser(dto: ValidateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.id_user },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (user.status === dto.status) {
      throw new BadRequestException(`Le compte a déjà le statut ${dto.status}`);
    }

    return this.prisma.user.update({
      where: { id: dto.id_user },
      data: { status: dto.status },
      select: validateSelect,
    });
  }
}

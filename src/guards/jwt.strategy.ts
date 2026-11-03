import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service.js';
import type { AppRequestUser } from '../common/request-user.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET est requis : aucune valeur par défaut n\'est acceptée.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: number; role: string }): Promise<AppRequestUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Token invalide');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, emailVerifiedAt: true },
    });

    if (!user || !user.emailVerifiedAt || user.status === 'REFUSED') {
      throw new UnauthorizedException('Compte introuvable, non vérifié ou refusé');
    }

    return { sub: user.id, email: user.email, role: user.role, status: user.status };
  }
}

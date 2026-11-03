import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma.service.js';
import type { AppRequestUser } from '../common/request-user.js';

/**
 * Autorise la création d'un compte administrateur sans authentification
 * UNIQUEMENT lorsqu'aucun administrateur n'existe encore (bootstrap).
 * Ensuite, l'appelant doit être authentifié et avoir le rôle ADMIN.
 */
@Injectable()
export class BootstrapAdminGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });

    if (adminCount === 0) {
      return true;
    }

    const activated = await super.canActivate(context);
    if (!activated) {
      return false;
    }

    const request = context.switchToHttp().getRequest<{ user?: AppRequestUser }>();
    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return true;
  }
}

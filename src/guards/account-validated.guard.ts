import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AppRequestUser } from '../common/request-user.js';

/**
 * Autorise uniquement les comptes validés par un administrateur
 * à effectuer des actions d'édition (publication, vérification, preuves).
 */
@Injectable()
export class AccountValidatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AppRequestUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    if (user.status !== 'VALIDATE' && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        "Votre compte est en attente de validation par un administrateur",
      );
    }

    return true;
  }
}

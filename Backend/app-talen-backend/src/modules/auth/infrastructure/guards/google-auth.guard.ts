import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../../users/domain/user-role.enum';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  override getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const roleParam =
      typeof request.query.role === 'string'
        ? request.query.role.toUpperCase()
        : undefined;

    const selectedRole =
      roleParam === UserRole.COMPANY ? UserRole.COMPANY : UserRole.TALENT;

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const baseUrl = frontendUrl.endsWith('/')
      ? frontendUrl.slice(0, -1)
      : frontendUrl;
    const failureRedirect = new URL('/login', baseUrl);
    failureRedirect.searchParams.set(
      'oauthError',
      'No se pudo autenticar con Google. Intenta nuevamente.',
    );

    return {
      state: selectedRole,
      failureRedirect: failureRedirect.toString(),
    };
  }
}

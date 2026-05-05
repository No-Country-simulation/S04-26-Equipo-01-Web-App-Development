import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenPayload } from '../../domain/auth-token-payload.type';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthTokenPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }

  private extractTokenFromHeader(request: AuthenticatedRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}

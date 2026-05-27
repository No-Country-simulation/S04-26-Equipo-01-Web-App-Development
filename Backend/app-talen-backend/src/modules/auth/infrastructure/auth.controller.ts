import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../application/auth.service';
import { LoginDto } from '../application/dto/login.dto';
import { RegisterDto } from '../application/dto/register.dto';
import { AuthResponse } from '../application/types/auth-response.type';
import type { AuthenticatedUser } from '../domain/authenticated-user.type';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './types/authenticated-request.type';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ExternalProfileDto } from '../application/dto/external-profile.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../users/domain/user-role.enum';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LinkedInAuthGuard } from './guards/linkedin-auth.guard';
import passport from 'passport';
import { AuthConnections } from '../domain/auth-connections.type';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ExternalProfileDto => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: ExternalProfileDto }>();
    return request.user;
  },
);

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar usuario',
    description: 'Registra un nuevo usuario en la plataforma.',
  })
  @ApiBody({ type: RegisterDto, description: 'Datos para el registro.' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado y autenticado.',
    type: Object,
  })
  register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Permite a un usuario autenticado iniciar sesión.',
  })
  @ApiBody({ type: LoginDto, description: 'Credenciales de acceso.' })
  @ApiResponse({
    status: 200,
    description: 'Usuario autenticado.',
    type: Object,
  })
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener mi usuario',
    description: 'Devuelve la información del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario autenticado.',
    type: Object,
  })
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest): Promise<AuthenticatedUser> {
    return this.authService.getMe(request.user.userId);
  }

  @Get('me/connections')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener estado de conexiones OAuth',
    description:
      'Devuelve el estado actual de conexiones de proveedores externos para el usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de conexiones OAuth.',
    type: Object,
  })
  @UseGuards(JwtAuthGuard)
  meConnections(
    @Req() request: AuthenticatedRequest,
  ): Promise<AuthConnections> {
    return this.authService.getMyConnections(request.user.userId);
  }

  @Get('linkedin')
  @ApiOperation({
    summary: 'Iniciar autenticación con LinkedIn',
    description: 'Redirige al usuario para autenticarse con LinkedIn.',
  })
  @UseGuards(LinkedInAuthGuard)
  linkedinAuth(): void {}

  @Get('linkedin/callback')
  @ApiOperation({
    summary: 'Callback de LinkedIn',
    description:
      'Callback para autenticación con LinkedIn. No requiere prueba manual.',
  })
  async linkedinAuthRedirect(
    @Req() request: Request,
    @Res() response: Response,
  ) {
      return this.handleOAuthCallback(
        request,
        response,
        'linkedin',
        'No se pudo completar el acceso con LinkedIn. Intenta nuevamente.',
      );
  }

  @Get('google')
  @ApiOperation({
    summary: 'Iniciar autenticación con Google',
    description: 'Redirige al usuario para autenticarse con Google.',
  })
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {}

  @Get('google/callback')
  @ApiOperation({
    summary: 'Callback de Google',
    description:
      'Callback para autenticación con Google. No requiere prueba manual.',
  })
  async googleAuthRedirect(
    @Req() request: Request,
    @Res() response: Response,
  ) {
      return this.handleOAuthCallback(
        request,
        response,
        'google',
        'No se pudo completar el acceso con Google. Intenta nuevamente.',
      );
  }

  private async handleOAuthCallback(
    request: Request,
    response: Response,
    strategy: 'google' | 'linkedin',
    genericErrorMessage: string,
  ): Promise<void> {
    await new Promise<void>((resolve) => {
      passport.authenticate(
        strategy,
        { session: false },
        async (error: unknown, user: ExternalProfileDto | false | null) => {
          if (error || !user) {
            response.redirect(this.buildFrontendLoginErrorUrl(genericErrorMessage));
            resolve();
            return;
          }

          try {
            const defaultRole = this.resolveOAuthRole(request.query.state);
            const authResponse = await this.authService.loginWithExternalProvider(
              user,
              defaultRole,
              strategy,
            );

            response.redirect(this.buildFrontendOAuthRedirectUrl(authResponse));
            resolve();
          } catch {
            response.redirect(this.buildFrontendLoginErrorUrl(genericErrorMessage));
            resolve();
          }
        },
      )(request, response);
    });
  }

  private resolveOAuthRole(state: unknown): UserRole {
    if (typeof state !== 'string') {
      return UserRole.TALENT;
    }

    const normalizedState = state.toUpperCase();
    if (normalizedState === UserRole.COMPANY) {
      return UserRole.COMPANY;
    }

    return UserRole.TALENT;
  }

  private buildFrontendOAuthRedirectUrl(authResponse: AuthResponse): string {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const baseUrl = frontendUrl.endsWith('/')
      ? frontendUrl.slice(0, -1)
      : frontendUrl;
    const redirectUrl = new URL('/auth/callback', baseUrl);

    redirectUrl.searchParams.set('token', authResponse.accessToken);
    redirectUrl.searchParams.set('userId', authResponse.user.id);
    redirectUrl.searchParams.set('email', authResponse.user.email);
    redirectUrl.searchParams.set('role', authResponse.user.role);

    return redirectUrl.toString();
  }

  private buildFrontendLoginErrorUrl(message: string): string {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const baseUrl = frontendUrl.endsWith('/')
      ? frontendUrl.slice(0, -1)
      : frontendUrl;
    const redirectUrl = new URL('/login', baseUrl);

    redirectUrl.searchParams.set('oauthError', message);

    return redirectUrl.toString();
  }
}

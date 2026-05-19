import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../application/auth.service';
import { LoginDto } from '../application/dto/login.dto';
import { RegisterDto } from '../application/dto/register.dto';
import { AuthResponse } from '../application/types/auth-response.type';
import type { AuthenticatedUser } from '../domain/authenticated-user.type';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './types/authenticated-request.type';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ExternalProfileDto } from '../application/dto/external-profile.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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
  constructor(private readonly authService: AuthService) {}

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

  @Get('linkedin')
  @ApiOperation({
    summary: 'Iniciar autenticación con LinkedIn',
    description: 'Redirige al usuario para autenticarse con LinkedIn.',
  })
  @UseGuards(AuthGuard('linkedin'))
  linkedinAuth(): void {}

  @Get('linkedin/callback')
  @ApiOperation({
    summary: 'Callback de LinkedIn',
    description:
      'Callback para autenticación con LinkedIn. No requiere prueba manual.',
  })
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuthRedirect(@GetUser() user: ExternalProfileDto) {
    return this.authService.loginWithExternalProvider(user);
  }

  @Get('google')
  @ApiOperation({
    summary: 'Iniciar autenticación con Google',
    description: 'Redirige al usuario para autenticarse con Google.',
  })
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {}

  @Get('google/callback')
  @ApiOperation({
    summary: 'Callback de Google',
    description:
      'Callback para autenticación con Google. No requiere prueba manual.',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@GetUser() user: ExternalProfileDto) {
    return this.authService.loginWithExternalProvider(user);
  }
}

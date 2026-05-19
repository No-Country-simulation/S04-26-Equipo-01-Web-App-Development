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
import { AuthenticatedUser } from '../domain/authenticated-user.type';
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
import { UserRole } from '../../users/domain/user-role.enum';

const registerRequestExample = {
  email: 'talent@example.com',
  password: 'StrongPass123',
  role: UserRole.TALENT,
};

const loginRequestExample = {
  email: 'talent@example.com',
  password: 'StrongPass123',
};

const authenticatedUserExample = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'talent@example.com',
  role: UserRole.TALENT,
};

const authResponseExample = {
  accessToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJyb2xlIjoiVEFMRU5UIiwiaWF0IjoxNzE2MDAwMDAwLCJleHAiOjE3MTY1OTQ4MDB9.example-signature',
  tokenType: 'Bearer',
  expiresIn: '7d',
  user: authenticatedUserExample,
};

const conflictResponseExample = {
  statusCode: 409,
  message: 'A user with this email already exists',
  error: 'Conflict',
};

const unauthorizedResponseExample = {
  statusCode: 401,
  message: 'Invalid credentials',
  error: 'Unauthorized',
};

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
  @ApiBody({
    type: RegisterDto,
    description: 'Datos para el registro.',
    schema: {
      example: registerRequestExample,
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado y autenticado.',
    type: AuthResponse,
    content: {
      'application/json': {
        example: authResponseExample,
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un usuario con ese correo.',
    content: {
      'application/json': {
        example: conflictResponseExample,
      },
    },
  })
  register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Permite a un usuario autenticado iniciar sesión.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Credenciales de acceso.',
    schema: {
      example: loginRequestExample,
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario autenticado.',
    type: AuthResponse,
    content: {
      'application/json': {
        example: authResponseExample,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas.',
    content: {
      'application/json': {
        example: unauthorizedResponseExample,
      },
    },
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
    type: AuthenticatedUser,
    content: {
      'application/json': {
        example: authenticatedUserExample,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o ausente.',
    content: {
      'application/json': {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        },
      },
    },
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
  @ApiResponse({
    status: 302,
    description: 'Redirección al proveedor de LinkedIn.',
  })
  @UseGuards(AuthGuard('linkedin'))
  linkedinAuth(): void {}

  @Get('linkedin/callback')
  @ApiOperation({
    summary: 'Callback de LinkedIn',
    description:
      'Callback para autenticación con LinkedIn. No requiere prueba manual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación con LinkedIn completada correctamente.',
    type: AuthResponse,
    content: {
      'application/json': {
        example: authResponseExample,
      },
    },
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
  @ApiResponse({
    status: 302,
    description: 'Redirección al proveedor de Google.',
  })
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {}

  @Get('google/callback')
  @ApiOperation({
    summary: 'Callback de Google',
    description:
      'Callback para autenticación con Google. No requiere prueba manual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación con Google completada correctamente.',
    type: AuthResponse,
    content: {
      'application/json': {
        example: authResponseExample,
      },
    },
  })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@GetUser() user: ExternalProfileDto) {
    return this.authService.loginWithExternalProvider(user);
  }
}

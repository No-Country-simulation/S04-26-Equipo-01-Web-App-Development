import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../application/auth.service';
import { LoginDto } from '../application/dto/login.dto';
import { RegisterDto } from '../application/dto/register.dto';
import { AuthResponse } from '../application/types/auth-response.type';
import type { AuthenticatedUser } from '../domain/authenticated-user.type';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './types/authenticated-request.type';
import type { ValidatedLinkedInUser } from './strategies/linkedin.strategy';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ValidatedLinkedInUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: ValidatedLinkedInUser }>();
    return request.user;
  },
);

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest): Promise<AuthenticatedUser> {
    return this.authService.getMe(request.user.userId);
  }

  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  linkedinAuth(): void {}

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuthRedirect(@GetUser() user: ValidatedLinkedInUser) {
    return this.authService.loginWithLinkedIn(user);
  }
}

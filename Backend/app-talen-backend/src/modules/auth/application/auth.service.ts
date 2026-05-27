import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../../users/infrastructure/entities/user.entity';
import { AuthenticatedUser } from '../domain/authenticated-user.type';
import { AuthTokenPayload } from '../domain/auth-token-payload.type';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './types/auth-response.type';
import { UserRole } from '../../users/domain/user-role.enum';
import { ExternalProfileDto } from './dto/external-profile.dto';
import { AuthConnections } from '../domain/auth-connections.type';
import { MailService } from '../../mail/application/mail.service';

@Injectable()
export class AuthService {
  private readonly jwtExpiresIn: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(registerDto.email);
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      role: registerDto.role,
    });

    try {
      const savedUser = await this.usersRepository.save(user);
      await this.sendRegistrationEmail(savedUser.email);
      return this.buildAuthResponse(savedUser);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('A user with this email already exists');
      }

      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository.findOne({
      where: { email: this.normalizeEmail(loginDto.email) },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async loginWithExternalProvider(
    profile: ExternalProfileDto,
    defaultRole: UserRole = UserRole.TALENT,
    provider: 'google' | 'linkedin' = 'google',
  ): Promise<AuthResponse> {
    const email = this.normalizeEmail(profile.email);
    let user = await this.usersRepository.findOne({ where: { email } });
    let createdFromOAuth = false;

    if (!user) {
      const hashedPassword = await bcrypt.hash(profile.email, 10);
      user = this.usersRepository.create({
        email,
        password: hashedPassword,
        imageUrl: profile.picture,
        role: defaultRole,
        linkedinProviderId:
          provider === 'linkedin' ? profile.providerId : undefined,
      });
      user = await this.usersRepository.save(user);
      createdFromOAuth = true;
    } else if (
      provider === 'linkedin' &&
      profile.providerId &&
      user.linkedinProviderId !== profile.providerId
    ) {
      user.linkedinProviderId = profile.providerId;
      user = await this.usersRepository.save(user);
    }

    if (createdFromOAuth) {
      await this.sendRegistrationEmail(user.email);
    }

    return this.buildAuthResponse(user);
  }

  private async sendRegistrationEmail(email: string): Promise<void> {
    try {
      await this.mailService.sendRegistrationConfirmation({
        to: email,
        recipientName: email,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown mail error';
      this.logger.warn(
        `Unable to send registration confirmation to ${email}: ${message}`,
      );
    }
  }

  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.toAuthenticatedUser(user);
  }

  async getMyConnections(userId: string): Promise<AuthConnections> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return {
      linkedinConnected: Boolean(user.linkedinProviderId),
    };
  }

  private buildAuthResponse(user: User): AuthResponse {
    const payload: AuthTokenPayload = {
      userId: user.id,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: this.toAuthenticatedUser(user),
    };
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      linkedinConnected: Boolean(user.linkedinProviderId),
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}

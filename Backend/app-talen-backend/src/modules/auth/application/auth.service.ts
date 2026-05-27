import {
  ConflictException,
  Logger,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { MailService } from '../../mail/application/mail.service';
import { User } from '../../users/infrastructure/entities/user.entity';
import { AuthenticatedUser } from '../domain/authenticated-user.type';
import { AuthTokenPayload } from '../domain/auth-token-payload.type';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './types/auth-response.type';
import { UserRole } from '../../users/domain/user-role.enum';
import { ExternalProfileDto } from './dto/external-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtExpiresIn: string;

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
      this.queueRegistrationConfirmation(savedUser);
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
  ): Promise<AuthResponse> {
    const email = this.normalizeEmail(profile.email);
    let user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      const rawRole = profile.role ? profile.role.toUpperCase() : '';
      if (!Object.values(UserRole).includes(rawRole as UserRole)) {
        throw new UnauthorizedException('Invalid request: Invalid user');
      }
      const hashedPassword = await bcrypt.hash(profile.email, 10);
      const assignedRole = rawRole as UserRole;
      user = this.usersRepository.create({
        email,
        password: hashedPassword,
        imageUrl: profile.picture,
        role: assignedRole,
      });
      user = await this.usersRepository.save(user);
      this.queueRegistrationConfirmation(user, this.buildRecipientName(profile));
    }

    return this.buildAuthResponse(user);
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
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private buildRecipientName(profile: ExternalProfileDto): string {
    const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();

    return fullName.length > 0 ? fullName : this.normalizeEmail(profile.email);
  }

  private queueRegistrationConfirmation(
    user: User,
    recipientName?: string,
  ): void {
    void this.mailService
      .sendRegistrationConfirmation({
        to: user.email,
        recipientName,
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `Unable to send registration confirmation to ${user.email}: ${message}`,
        );
      });
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

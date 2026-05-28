import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../users/domain/user-role.enum';
import { User } from '../../users/infrastructure/entities/user.entity';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const seedEnabled =
      this.configService.get<string>('SEED_DEFAULT_ADMIN', 'true') === 'true';

    if (!seedEnabled) {
      this.logger.log('Default admin seed disabled (SEED_DEFAULT_ADMIN=false)');
      return;
    }

    const email = this.configService
      .get<string>('DEFAULT_ADMIN_EMAIL', 'admin@talen.local')
      .trim()
      .toLowerCase();
    const plainPassword = this.configService.get<string>(
      'DEFAULT_ADMIN_PASSWORD',
      'AdminTemp2026!',
    );
    const forcePasswordSync =
      this.configService.get<string>('DEFAULT_ADMIN_FORCE_SYNC', 'false') ===
      'true';

    if (!email || !plainPassword) {
      this.logger.warn(
        'Default admin seed skipped: missing DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD',
      );
      return;
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const user = this.usersRepository.create({
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
      });
      try {
        await this.usersRepository.save(user);
      } catch (error) {
        // If multiple instances boot at the same time, another instance may create the user first.
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
      }
      this.logger.log(`Default admin created: ${email}`);
      return;
    }

    if (!forcePasswordSync) {
      this.logger.log(`Default admin already exists: ${email}`);
      return;
    }

    existingUser.password = await bcrypt.hash(plainPassword, 10);
    existingUser.role = UserRole.ADMIN;
    await this.usersRepository.save(existingUser);
    this.logger.log(`Default admin synchronized: ${email}`);
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const code = (error as QueryFailedError & { code?: string }).code;
    return code === '23505';
  }
}
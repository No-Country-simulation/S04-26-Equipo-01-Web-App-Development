import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { User } from '../users/infrastructure/entities/user.entity';
import { AuthService } from './application/auth.service';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { AuthController } from './infrastructure/auth.controller';
import { LinkedInStrategy } from './infrastructure/strategies/linkedin.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    UsersModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = configService.get<string>(
          'JWT_EXPIRES_IN',
          '7d',
        ) as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

        return {
          secret: configService.get<string>(
            'JWT_SECRET',
            'dev-secret-change-me',
          ),
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, LinkedInStrategy],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}

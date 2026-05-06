import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProfilesService } from './application/profiles.service';
import { Profile } from './infrastructure/entities/profile.entity';
import { ProfilesController } from './infrastructure/profiles.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Profile])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [TypeOrmModule],
})
export class ProfilesModule {}

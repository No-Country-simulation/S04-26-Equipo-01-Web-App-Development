import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { Assessment } from '../assessment/infrastructure/entities/assessment.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModuleProgress } from '../learning/infrastructure/entities/user-module-progress.entity';
import { UserSkill } from '../skills/infrastructure/entities/user-skill.entity';
import { ProfilesService } from './application/profiles.service';
import { CvDiagnostic } from './infrastructure/entities/cv-diagnostic.entity';
import { ProfileEducation } from './infrastructure/entities/profile-education.entity';
import { ProfileExperience } from './infrastructure/entities/profile-experience.entity';
import { Profile } from './infrastructure/entities/profile.entity';
import { ProfilesController } from './infrastructure/profiles.controller';

@Module({
  imports: [
    AiModule,
    AuthModule,
    TypeOrmModule.forFeature([
      Profile,
      CvDiagnostic,
      ProfileExperience,
      ProfileEducation,
      Assessment,
      UserModuleProgress,
      UserSkill,
    ]),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [TypeOrmModule],
})
export class ProfilesModule {}

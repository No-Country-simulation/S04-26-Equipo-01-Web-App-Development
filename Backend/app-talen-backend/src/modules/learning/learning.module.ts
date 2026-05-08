import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from '../assessment/infrastructure/entities/assessment.entity';
import { AuthModule } from '../auth/auth.module';
import { Profile } from '../profiles/infrastructure/entities/profile.entity';
import { LearningService } from './application/learning.service';
import { LearningController } from './infrastructure/learning.controller';
import { LearningModule as LearningModuleEntity } from './infrastructure/entities/learning-module.entity';
import { LearningPath } from './infrastructure/entities/learning-path.entity';
import { UserModuleProgress } from './infrastructure/entities/user-module-progress.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      LearningPath,
      LearningModuleEntity,
      UserModuleProgress,
      Profile,
      Assessment,
    ]),
  ],
  controllers: [LearningController],
  providers: [LearningService],
  exports: [TypeOrmModule],
})
export class LearningModule {}

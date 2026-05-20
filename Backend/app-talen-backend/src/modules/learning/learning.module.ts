import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningModule as LearningModuleEntity } from './infrastructure/entities/learning-module.entity';
import { LearningPath } from './infrastructure/entities/learning-path.entity';
import { UserModuleProgress } from './infrastructure/entities/user-module-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningPath,
      LearningModuleEntity,
      UserModuleProgress,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class LearningModule {}

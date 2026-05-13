import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { Profile } from '../profiles/infrastructure/entities/profile.entity';
import { AssessmentService } from './application/assessment.service';
import { AssessmentController } from './infrastructure/assessment.controller';
import { AssessmentTestResultEntity } from './infrastructure/entities/assessment-test-result.entity';
import { Assessment } from './infrastructure/entities/assessment.entity';

@Module({
  imports: [
    AiModule,
    AuthModule,
    TypeOrmModule.forFeature([Assessment, AssessmentTestResultEntity, Profile]),
  ],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [TypeOrmModule],
})
export class AssessmentModule {}

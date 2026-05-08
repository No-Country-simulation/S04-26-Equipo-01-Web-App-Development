import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Profile } from '../profiles/infrastructure/entities/profile.entity';
import { AssessmentService } from './application/assessment.service';
import { AssessmentController } from './infrastructure/assessment.controller';
import { Assessment } from './infrastructure/entities/assessment.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Assessment, Profile])],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [TypeOrmModule],
})
export class AssessmentModule {}

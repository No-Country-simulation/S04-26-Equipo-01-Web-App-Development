import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateApplication } from './infrastructure/entities/candidate-application.entity';
import { CompanyFeedback } from './infrastructure/entities/company-feedback.entity';
import { JobOpportunity } from './infrastructure/entities/job-opportunity.entity';
import { RecruiterController } from './infrastructure/recruiter.controller';
import { MarketplaceController } from './infrastructure/marketplace.controller';
import { MarketplaceService } from './domain/marketplace.service';
import { Profile } from '../profiles/infrastructure/entities/profile.entity';
import { UserSkill } from '../skills/infrastructure/entities/user-skill.entity';
import { AssessmentTestResultEntity } from '../assessment/infrastructure/entities/assessment-test-result.entity';
import { User } from '../users/infrastructure/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { Company } from '../companies/infrastructure/entities/company.entity';
import { Skill } from '../skills/infrastructure/entities/skill.entity';
import { LearningPath } from '../learning/infrastructure/entities/learning-path.entity';
import { CourseModule } from '../courses/infrastructure/entities/course-module.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      JobOpportunity,
      CandidateApplication,
      CompanyFeedback,
      Profile,
      UserSkill,
      AssessmentTestResultEntity,
      User,
      Company,
      Skill,
      LearningPath,
      CourseModule,
    ]),
  ],
  controllers: [RecruiterController, MarketplaceController],
  providers: [MarketplaceService],
  exports: [TypeOrmModule, MarketplaceService],
})
export class MarketplaceModule {}
